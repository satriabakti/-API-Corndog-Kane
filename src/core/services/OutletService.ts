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
    isForOneWeek: boolean
  ): Promise<TOutletAssignmentWithRelations[]> {
    const assignments: { outletId: number; employeeId: number; assignedAt: Date }[] = [];
    
    if (isForOneWeek) {
      // Generate assignments for 7 days forward
      for (let i = 0; i < 7; i++) {
        const assignmentDate = new Date(startDate);
        assignmentDate.setDate(startDate.getDate() + i);
        assignments.push({
          outletId,
          employeeId,
          assignedAt: assignmentDate,
        });
      }
    } else {
      // Generate assignment for 1 day only
      assignments.push({
        outletId,
        employeeId,
        assignedAt: startDate,
      });
    }

    return await this.repository.bulkAssignEmployeeToOutlet(assignments);
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
}