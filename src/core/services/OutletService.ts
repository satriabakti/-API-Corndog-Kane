import OutletRepository from "../../adapters/postgres/repositories/OutletRepository";
import UserRepository from "../../adapters/postgres/repositories/UserRepository";
import { TOutlet, TOutletCreate, TOutletUpdate, TOutletWithSettings, TOutletProductStockResponse, TOutletMaterialStockResponse, TOutletSetting } from "../entities/outlet/outlet";
import { TOutletAssignmentWithRelations } from "../entities/outlet/assignment";
import { TUser, TUserCreate } from "../entities/user/user";
import { Service } from "./Service";
import bcrypt from "bcrypt";

export default class OutletService extends Service<TOutlet> {
	declare repository: OutletRepository;
	declare userRepository: UserRepository;

	constructor(repository: OutletRepository) {
		super(repository);
		this.userRepository = new UserRepository();
	}

	/**
	 * Validate settings for overlap
	 * Rejects if there are settings with same days AND same checkin_time AND same checkout_time
	 */
	private validateSettingsOverlap(settings: TOutletSetting[]): void {
		for (let i = 0; i < settings.length; i++) {
			for (let j = i + 1; j < settings.length; j++) {
				const setting1 = settings[i];
				const setting2 = settings[j];
				
				// Check if there are common days
				const hasCommonDay = setting1.days.some(day => setting2.days.includes(day));
				
				// Check if times are the same
				const sameCheckin = setting1.checkin_time === setting2.checkin_time;
				const sameCheckout = setting1.checkout_time === setting2.checkout_time;
				
				// Reject if there's overlap
				if (hasCommonDay && sameCheckin && sameCheckout) {
					const commonDays = setting1.days.filter(day => setting2.days.includes(day));
					throw new Error(`Duplicate setting found for days: ${commonDays.join(', ')}. Same checkin and checkout times are not allowed.`);
				}
			}
		}
	}

	async createOutlet(item: TOutletCreate ): Promise<TOutlet | TOutletWithSettings> {
		// Validate settings overlap
		this.validateSettingsOverlap(item.settings);

		let userIdToUse: number = item.userId ? item.userId : 0;
		if (item.user && !item.userId) {
			// Hash password before creating user
			const hashedPassword = await bcrypt.hash(item.user.password, 10);
			
			const userData = {
				name: item.user.name,
				username: item.user.username,
				password: hashedPassword,
				role_id: item.user.role_id,
			} as TUserCreate;
			const newUser = await this.userRepository.create(userData as TUser) as TUser;
			userIdToUse = +newUser.id;
		}

		const newOutlet = await this.repository.create({
			...item,
			userId: userIdToUse || 1,
		} as unknown as TOutletWithSettings & { userId: number });
		return newOutlet;
	}

	async updateOutlet(id: number, item: Partial<TOutletUpdate>): Promise<TOutlet | TOutletWithSettings | null> {
		// Validate settings overlap if settings are provided
		if (item.settings) {
			this.validateSettingsOverlap(item.settings);
		}

		const updatedOutlet = await this.repository.update(id.toString(), item as Partial<TOutletWithSettings>);
		return updatedOutlet;
	}

  async assignEmployeeToOutletForDates(
    outletId: number,
    employeeId: number,
    startDate: Date,
    isForOneWeek: boolean,
    isForOneMonth: boolean,
    previousStatus?: string,
    notes?: string
  ): Promise<{ assignments: TOutletAssignmentWithRelations[]; attendances: any[]; action: string }> {
    const { generateDateRange, getNextSaturday, getLastSaturdayOfMonth, normalizeToStartOfDay } = 
      await import('../utils/dateHelper');
    
    // Determine end date based on flags
    let endDate: Date;
    
    if (isForOneMonth) {
      // End on last Saturday of the month
      endDate = getLastSaturdayOfMonth(startDate);
    } else if (isForOneWeek) {
      // End on next Saturday
      endDate = getNextSaturday(startDate);
    } else {
      // Single day
      endDate = new Date(startDate);
    }
    
    // Generate all dates in range
    const dates = generateDateRange(normalizeToStartOfDay(startDate), normalizeToStartOfDay(endDate));
    
    const assignments: TOutletAssignmentWithRelations[] = [];
    const attendances: any[] = [];
    let actionType = 'simple_assignment';
    
    // Process each date
    for (const date of dates) {
      // FIRST: Check if the new employee is already assigned to a DIFFERENT outlet on this date
      const newEmployeeExistingAssignment = await this.repository.findEmployeeAssignmentByDate(employeeId, date);
      
      if (newEmployeeExistingAssignment && newEmployeeExistingAssignment.outlet_id !== outletId) {
        // Validation: Prevent duplicate assignment to different outlet on same day
        // Only allow if previousStatus is provided (indicating intentional move/swap)
        if (!previousStatus) {
          throw new Error(
            `Employee is already assigned to outlet "${newEmployeeExistingAssignment.outlet.name}" (ID: ${newEmployeeExistingAssignment.outlet_id}) on ${date.toISOString().split('T')[0]}. ` +
            `Cannot assign to multiple outlets on the same day. To move the employee, provide previous_status parameter.`
          );
        }
        
        // Employee is assigned to another outlet with previous_status - delete that assignment
        await this.repository.deleteAssignmentsByOutletAndDate(
          newEmployeeExistingAssignment.outlet_id,
          date
        );
      }
      
      // SECOND: Check for existing assignment on this outlet for this date
      const existingAssignment = await this.repository.findAssignmentByOutletAndDate(outletId, date);
      
      if (!existingAssignment) {
        // No conflict - simple assignment
        const newAssignment = await this.repository.assignEmployeeToOutlet(outletId, employeeId, date);
        assignments.push(newAssignment);
        continue;
      }
      
      // Conflict detected - check if employee already has PRESENT attendance
      const presentAttendance = await this.repository.findAttendanceByEmployeeOutletDate(
        existingAssignment.employee_id,
        outletId,
        date,
        'PRESENT'
      );
      
      if (presentAttendance) {
        throw new Error(
          `Cannot reassign: Employee ${existingAssignment.employee.name} has already checked in as PRESENT on ${date.toISOString().split('T')[0]}`
        );
      }
      
      // Apply scenario logic based on previous_status
      if (previousStatus === 'PRESENT') {
        // Scenario 2: SWAP employees - DO NOT create attendance
        actionType = 'swap';
        
        // Find new employee's current assignment for this date
        const newEmployeeAssignment = await this.repository.findEmployeeAssignmentByDate(employeeId, date);
        
        if (newEmployeeAssignment) {
          // Swap the two employees (no attendance created)
          const swapped = await this.repository.swapEmployeeAssignments(
            existingAssignment.employee_id,
            employeeId,
            outletId,
            newEmployeeAssignment.outlet_id,
            date
          );
          assignments.push(...swapped);
        } else {
          // New employee has no assignment - just reassign without attendance
          await this.repository.assignEmployeeToOutlet(outletId, employeeId, date);
          const newAssignment = await this.repository.assignEmployeeToOutlet(outletId, employeeId, date);
          assignments.push(newAssignment);
          actionType = 'simple_assignment';
        }
      } else if (previousStatus) {
        // Scenario 1 & 3: REPLACE with status (SICK, NOT_PRESENT, etc.)
        actionType = 'replace';
        
        const result = await this.repository.replaceEmployeeWithAttendance(
          existingAssignment.employee_id,
          employeeId,
          outletId,
          date,
          previousStatus as any,
          notes
        );
        assignments.push(result.assignment);
        attendances.push(result.attendance);
      } else {
        // No previous_status provided - simple replacement
        const newAssignment = await this.repository.assignEmployeeToOutlet(outletId, employeeId, date);
        assignments.push(newAssignment);
      }
    }
    
    return {
      assignments,
      attendances,
      action: actionType,
    };
  }

  async getOutletProductStocks(
    outletId: number,
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<TOutletProductStockResponse> {
    const { stocks, total } = await this.repository.getOutletProductStocks(
      outletId,
      page,
      limit,
      startDate,
      endDate
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: stocks,
      metadata: {
        page,
        limit,
        total_records: total,
        total_pages: totalPages,
      },
    };
  }

  async getOutletMaterialStocks(
    outletId: number,
    page: number = 1,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<TOutletMaterialStockResponse> {
    const { stocks, total } = await this.repository.getOutletMaterialStocks(
      outletId,
      page,
      limit,
      startDate,
      endDate
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: stocks,
      metadata: {
        page,
        limit,
        total_records: total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Delete all employee assignments for a specific outlet on a specific date
   * @param outletId - The outlet ID
   * @param date - The date to delete assignments for
   * @returns Number of deleted assignments
   */
  async deleteScheduleByOutletAndDate(
    outletId: number,
    date: Date
  ): Promise<number> {
    return this.repository.deleteAssignmentsByOutletAndDate(outletId, date);
  }

  /**
   * Get financial summary for outlet (income, expenses, profit, sold quantity)
   * @param outletId - The outlet ID
   * @param fromDate - Optional start date
   * @param toDate - Optional end date
   * @param status - Optional order status filter
   */
  async getOutletSummarize(
    outletId: number,
    fromDate?: Date,
    toDate?: Date,
    status?: string
  ): Promise<{
    outlet_id: number;
    outlet_name: string;
    outlet_code: string;
    total_income: number;
    total_expenses: number;
    total_profit: number;
    total_sold_quantity: number;
  }> {
    return this.repository.getOutletSummarize(outletId, fromDate, toDate, status);
  }
}
