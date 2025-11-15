import { TOutlet, TOutletWithSettings, TOutletStockItem, TMaterialStockItem, TOutletSettingEntity } from "../../../core/entities/outlet/outlet";
import { TOutletAssignmentWithRelations } from "../../../core/entities/outlet/assignment";
import { OutletRepository as IOutletRepository } from "../../../core/repositories/outlet";
import Repository from "./Repository";
import { DAY, AttendanceStatus, Attendance } from "@prisma/client";

export default class OutletRepository
  extends Repository<TOutlet>
  implements IOutletRepository {
  constructor() {
    super("outlet");
  }
  
  /**
   * Override getById to use findById with settings
   */
  override async getById(id: string): Promise<TOutlet | null> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error(`Invalid ID format: ${id}`);
    }
    return this.findById(numericId) as Promise<TOutlet | null>;
  }
  
  async findById(id: number): Promise<TOutletWithSettings | null> {
    const outlet = await this.getModel().findUnique({
      where: { id },
      include:{
        user: true,
        settings: true,
      }
    })
    if (!outlet) return null;
    
    const mapped = this.mapper.mapToEntity(outlet) as TOutlet;
    
    // Map settings
    type OutletWithSettings = typeof outlet & { 
      settings?: Array<{
        id: number;
        outlet_id: number;
        check_in_time: string;
        check_out_time: string;
        salary: number;
        day: string[];
      }>
    };
    const outletData = outlet as OutletWithSettings;
    const settings: TOutletSettingEntity[] = (outletData.settings || []).map((s) => ({
      id: s.id,
      outletId: s.outlet_id,
      checkinTime: s.check_in_time,
      checkoutTime: s.check_out_time,
      salary: s.salary,
      days: s.day || [],
    }));
    
    return {
      ...mapped,
      settings,
    };
  }

  /**
   * Get the latest active employee name for an outlet
   * Returns null if no active employee is assigned
   */
  async getLatestEmployeeName(outletId: number): Promise<string | null> {
    const latestAssignment = await this.prisma.outletEmployee.findFirst({
      where: {
        outlet_id: outletId,
        is_active: true,
      },
      orderBy: {
        assigned_at: 'desc',
      },
      include: {
        employee: true,
      },
    });

    return latestAssignment?.employee?.name || null;
  }

  override async create(item: TOutlet): Promise<TOutlet> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemData = item as any;
    
    console.log('Creating outlet with data:', JSON.stringify({
      name: itemData.name,
      settings: itemData.settings,
      userId: itemData.userId
    }, null, 2));
    
    // Use transaction to ensure rollback if settings creation fails
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create outlet
        const outlet = await tx.outlet.create({
          data: {
            name: itemData.name as string,
            is_active: itemData.isActive as boolean,
            code: itemData.code as string,
            location: itemData.location as string,
            description: itemData.description as string | null,
            income_target: itemData.incomeTarget as number,
            user_id: itemData.userId as number,
          },
        });
        
        console.log('Outlet created with ID:', outlet.id);
        
        // Create settings
        const outletId = typeof outlet.id === 'string' ? parseInt(outlet.id) : outlet.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const settingsData = itemData.settings.map((s: any) => ({
          outlet_id: outletId,
          check_in_time: s.checkin_time,
          check_out_time: s.checkout_time,
          salary: s.salary,
          day: { set: s.days as DAY[] },
        }));
        
        console.log('Creating settings:', JSON.stringify(settingsData, null, 2));
        
        await tx.outletSetting.createMany({
          data: settingsData,
        });
        
        console.log('Settings created successfully');
        
        return outletId;
      });
      
      // Fetch created outlet with settings
      const createdOutlet = await this.findById(result);
      return createdOutlet as unknown as TOutlet;
    } catch (error) {
      console.error('Failed to create outlet:', error);
      throw error;
    }
  }

  /**
   * Update outlet and its settings
   */
  override async update(id: string, item: Partial<TOutletWithSettings & { userId?: number }>): Promise<TOutlet> {
    const outletId = parseInt(id);
    
    // Update outlet basic fields
    const updateData: Record<string, unknown> = {};
    if (item.name !== undefined) updateData.name = item.name;
    if (item.location !== undefined) updateData.location = item.location;
    if (item.code !== undefined) updateData.code = item.code;
    if (item.description !== undefined) updateData.description = item.description;
    if (item.isActive !== undefined) updateData.is_active = item.isActive;
    if (item.incomeTarget !== undefined) updateData.income_target = item.incomeTarget;
    if (item.userId !== undefined) updateData.user_id = item.userId;
    
    if (Object.keys(updateData).length > 0) {
      await this.getModel().update({
        where: { id: outletId },
        data: updateData,
      });
    }
    
    // Update settings if provided
    if (item.settings) {
      const providedIds = item.settings.filter(s => s.id).map(s => s.id as number);
      
      // Delete settings not in the request
      await this.prisma.outletSetting.deleteMany({
        where: {
          outlet_id: outletId,
          id: { notIn: providedIds },
        },
      });
      
      // Update or create settings
      for (const setting of item.settings) {
        if (setting.id) {
          // Update existing
          await this.prisma.outletSetting.update({
            where: { id: setting.id },
            data: {
              check_in_time: setting.checkinTime,
              check_out_time: setting.checkoutTime,
              salary: setting.salary,
              day: { set: setting.days as DAY[] },
            },
          });
        } else {
          // Create new
          await this.prisma.outletSetting.create({
            data: {
              outlet_id: outletId,
              check_in_time: setting.checkinTime,
              check_out_time: setting.checkoutTime,
              salary: setting.salary,
              day: { set: setting.days as DAY[] },
            },
          });
        }
      }
    }
    
    const result = await this.findById(outletId);
    return result as unknown as TOutlet;
  }

  /**
   * Get setting for checkin based on day and time
   * Returns the setting with the latest checkin_time that is <= current time
   */
  async getSettingForCheckin(outletId: number, day: string, currentTime: string): Promise<TOutletSettingEntity | null> {
    const settings = await this.prisma.outletSetting.findMany({
      where: {
        outlet_id: outletId,
        day: { has: day as DAY },
      },
      orderBy: {
        check_in_time: 'desc',
      },
    });
    
    // Filter settings where check_in_time <= currentTime
    const validSettings = settings.filter(s => s.check_in_time <= currentTime);
    
    if (validSettings.length === 0) return null;
    
    const setting = validSettings[0];
    return {
      id: setting.id,
      outletId: setting.outlet_id,
      checkinTime: setting.check_in_time,
      checkoutTime: setting.check_out_time,
      salary: setting.salary,
      days: setting.day || [],
    };
  }

  async assignEmployeeToOutlet(
    outletId: number,
    employeeId: number,
    assignedAt: Date
  ): Promise<TOutletAssignmentWithRelations> {
    // First, deactivate any existing assignments for the same outlet, employee, and date
    const startOfDay = new Date(assignedAt);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(assignedAt);
    endOfDay.setHours(23, 59, 59, 999);

    await this.prisma.outletEmployee.updateMany({
      where: {
        outlet_id: outletId,
        employee_id: employeeId,
        assigned_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    // Then create the new assignment
    const assignment = await this.prisma.outletEmployee.create({
      data: {
        outlet_id: outletId,
        employee_id: employeeId,
        assigned_at: assignedAt,
        is_active: true,
      },
      include: {
        outlet: true,
        employee: true,
      },
    });
    
    return assignment as unknown as TOutletAssignmentWithRelations;
  }

  async bulkAssignEmployeeToOutlet(
    assignments: { outletId: number; employeeId: number; assignedAt: Date }[]
  ): Promise<TOutletAssignmentWithRelations[]> {
    const createdAssignments: TOutletAssignmentWithRelations[] = [];
    
    for (const assignment of assignments) {
      const created = await this.assignEmployeeToOutlet(
        assignment.outletId,
        assignment.employeeId,
        assignment.assignedAt
      );
      createdAssignments.push(created);
    }

    return createdAssignments;
  }

  /**
   * Get product stock movements with pagination
   */
  async getOutletProductStocks(
    outletId: number,
    page: number = 1,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ stocks: TOutletStockItem[]; total: number }> {
    // Get all products
    const productsRaw = await this.prisma.product.findMany({
      where: { is_active: true },
      include: {
        product_master: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Map products to include name field
    const products = productsRaw.map(p => ({
      ...p,
      name: p.product_master.name,
    }));

    // Set date range - default last 30 days if not provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get all dates in range
    const dates: string[] = [];
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Reverse to show newest first
    dates.reverse();

    // Build flat array of all date × product combinations
    const allRecords: TOutletStockItem[] = [];

    for (const date of dates) {
      const currentDateObj = new Date(date);
      
      const previousDate = new Date(currentDateObj);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      for (const product of products) {
        // Calculate first_stock (remaining_stock from previous day)
        const previousDayIndex = allRecords.findIndex(
          r => r.date === previousDateStr && r.product_id === product.id
        );
        const firstStock = previousDayIndex >= 0 ? allRecords[previousDayIndex].remaining_stock : 0;

        // Calculate stock_in (approved outlet requests for this day)
        // Use DATE(updatedAt) for timezone-safe date comparison
        const stockInResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
          SELECT COALESCE(SUM("approval_quantity"), 0)::bigint as total
          FROM "outlet_requests"
          WHERE "product_id" = ${product.id}
            AND "outlet_id" = ${outletId}
            AND "status" = 'APPROVED'
            AND "is_active" = true
            AND DATE("updatedAt") = ${date}::date
        `;
        const stockIn = Number(stockInResult[0]?.total || 0);

        // Calculate sold_stock (order items for this day)
        // Use DATE(createdAt) for timezone-safe date comparison
        const soldStockResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
          SELECT COALESCE(SUM(oi."quantity"), 0)::bigint as total
          FROM "order_items" oi
          INNER JOIN "orders" o ON oi."order_id" = o."id"
          WHERE oi."product_id" = ${product.id}
            AND o."outlet_id" = ${outletId}
            AND o."is_active" = true
            AND oi."is_active" = true
            AND DATE(o."createdAt") = ${date}::date
        `;
        const soldStock = Number(soldStockResult[0]?.total || 0);

        
        // Calculate remaining_stock
        const remainingStock = firstStock + stockIn - soldStock;

        allRecords.push({
          date,
          product_id: product.id,
          product_name: product.name,
          first_stock: firstStock,
          stock_in: stockIn,
          sold_stock: soldStock,
          remaining_stock: remainingStock,
        });
      }
    }

    // Apply pagination
    const total = allRecords.length;
    
    // If no limit provided, return all records
    if (!limit) {
      return {
        stocks: allRecords,
        total,
      };
    }
    
    const skip = (page - 1) * limit;
    const paginatedStocks = allRecords.slice(skip, skip + limit);

    return {
      stocks: paginatedStocks,
      total,
    };
  }

  /**
   * Get material stock movements with pagination
   */
  async getOutletMaterialStocks(
    outletId: number,
    page: number = 1,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ stocks: TMaterialStockItem[]; total: number }> {
    // Get all materials
    const materials = await this.prisma.material.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });

    // Set date range - default last 30 days if not provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get all dates in range
    const dates: string[] = [];
    const currentDate = new Date(start);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Reverse to show newest first
    dates.reverse();

    // Build flat array of all date × material combinations
    const allRecords: TMaterialStockItem[] = [];

    for (const date of dates) {
      const currentDateObj = new Date(date);

      const previousDate = new Date(currentDateObj);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];

      for (const material of materials) {
        // Calculate first_stock (remaining_stock from previous day)
        const previousDayIndex = allRecords.findIndex(
          r => r.date === previousDateStr && r.material_id === material.id
        );
        const firstStock = previousDayIndex >= 0 ? allRecords[previousDayIndex].remaining_stock : 0;

        // Calculate stock_in (approved outlet material requests for this day)
        // Use DATE(updatedAt) for timezone-safe date comparison
        const stockInResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
          SELECT COALESCE(SUM("approval_quantity"), 0)::bigint as total
          FROM "outlet_material_requests"
          WHERE "material_id" = ${material.id}
            AND "outlet_id" = ${outletId}
            AND "status" = 'APPROVED'
            AND "is_active" = true
            AND DATE("updatedAt") = ${date}::date
        `;
        const stockIn = Number(stockInResult[0]?.total || 0);

        // Calculate used_stock (material out for this day)
        // Use DATE(used_at) for timezone-safe date comparison
        const usedStockResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
          SELECT COALESCE(SUM("quantity"), 0)::bigint as total
          FROM "material_outs"
          WHERE "material_id" = ${material.id}
            AND DATE("used_at") = ${date}::date
        `;
        const usedStock = Number(usedStockResult[0]?.total || 0);

        // Calculate remaining_stock
        const remainingStock = firstStock + stockIn - usedStock;

        allRecords.push({
          date,
          material_id: material.id,
          material_name: material.name,
          first_stock: firstStock,
          stock_in: stockIn,
          used_stock: usedStock,
          remaining_stock: remainingStock,
        });
      }
    }

    // Apply pagination
    // Apply pagination
    const total = allRecords.length;
    
    // If no limit provided, return all records
    if (!limit) {
      return {
        stocks: allRecords,
        total,
      };
    }
    
    const skip = (page - 1) * limit;
    const paginatedStocks = allRecords.slice(skip, skip + limit);

    return {
      stocks: paginatedStocks,
      total,
    };
  }

  /**
   * Find existing assignment for outlet on a specific date
   */
  async findAssignmentByOutletAndDate(
    outletId: number,
    date: Date
  ): Promise<TOutletAssignmentWithRelations | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const assignment = await this.prisma.outletEmployee.findFirst({
      where: {
        outlet_id: outletId,
        assigned_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_active: true,
      },
      include: {
        outlet: true,
        employee: true,
      },
    });

    return assignment as unknown as TOutletAssignmentWithRelations | null;
  }

  /**
   * Find attendance for employee on outlet and date with specific status
   */
  async findAttendanceByEmployeeOutletDate(
    employeeId: number,
    outletId: number,
    date: Date,
    status: AttendanceStatus = 'PRESENT'
  ): Promise<Attendance | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.attendance.findFirst({
      where: {
        employee_id: employeeId,
        outlet_id: outletId,
        checkin_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
        attendance_status: status,
        is_active: true,
      },
    });
  }

  /**
   * Find current assignment for employee on a specific date
   */
  async findEmployeeAssignmentByDate(
    employeeId: number,
    date: Date
  ): Promise<TOutletAssignmentWithRelations | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const assignment = await this.prisma.outletEmployee.findFirst({
      where: {
        employee_id: employeeId,
        assigned_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_active: true,
      },
      include: {
        outlet: true,
        employee: true,
      },
    });

    return assignment as unknown as TOutletAssignmentWithRelations | null;
  }

  /**
   * Swap employees between two outlets on a specific date
   */
  async swapEmployeeAssignments(
    employee1Id: number,
    employee2Id: number,
    outlet1Id: number,
    outlet2Id: number,
    date: Date
  ): Promise<TOutletAssignmentWithRelations[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Deactivate both current assignments
      await tx.outletEmployee.updateMany({
        where: {
          OR: [
            { outlet_id: outlet1Id, employee_id: employee1Id, assigned_at: { gte: startOfDay, lte: endOfDay } },
            { outlet_id: outlet2Id, employee_id: employee2Id, assigned_at: { gte: startOfDay, lte: endOfDay } },
          ],
          is_active: true,
        },
        data: { is_active: false },
      });

      // 2. Create swapped assignments
      const assignment1 = await tx.outletEmployee.create({
        data: {
          outlet_id: outlet2Id,
          employee_id: employee1Id,
          assigned_at: date,
          is_active: true,
        },
        include: {
          outlet: true,
          employee: true,
        },
      });

      const assignment2 = await tx.outletEmployee.create({
        data: {
          outlet_id: outlet1Id,
          employee_id: employee2Id,
          assigned_at: date,
          is_active: true,
        },
        include: {
          outlet: true,
          employee: true,
        },
      });

      return [assignment1, assignment2] as unknown as TOutletAssignmentWithRelations[];
    });
  }

  /**
   * Replace employee with attendance record for previous employee
   */
  async replaceEmployeeWithAttendance(
    oldEmployeeId: number,
    newEmployeeId: number,
    outletId: number,
    date: Date,
    previousStatus: AttendanceStatus,
    notes?: string
  ): Promise<{ assignment: TOutletAssignmentWithRelations; attendance: Attendance }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Deactivate old employee's assignment
      await tx.outletEmployee.updateMany({
        where: {
          outlet_id: outletId,
          employee_id: oldEmployeeId,
          assigned_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          is_active: true,
        },
        data: { is_active: false },
      });

      // 2. Create attendance for old employee with specified status
      const attendance = await tx.attendance.create({
        data: {
          employee_id: oldEmployeeId,
          outlet_id: outletId,
          attendance_status: previousStatus,
          checkin_time: startOfDay,
          checkin_image_proof: 'SYSTEM_GENERATED_PLACEHOLDER',
          late_notes: notes || `System generated: ${previousStatus} - Employee reassigned`,
          late_approval_status: 'APPROVED',
          is_active: true,
        },
      });

      // 3. Deactivate any existing assignment for new employee on this outlet/date
      await tx.outletEmployee.updateMany({
        where: {
          outlet_id: outletId,
          employee_id: newEmployeeId,
          assigned_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          is_active: true,
        },
        data: { is_active: false },
      });

      // 4. Create new assignment for new employee
      const assignment = await tx.outletEmployee.create({
        data: {
          outlet_id: outletId,
          employee_id: newEmployeeId,
          assigned_at: date,
          is_active: true,
        },
        include: {
          outlet: true,
          employee: true,
        },
      });

      return {
        assignment: assignment as unknown as TOutletAssignmentWithRelations,
        attendance,
      };
    });
  }

  /**
   * Delete all employee assignments for a specific outlet on a specific date
   * @param outletId - The outlet ID
   * @param date - The date to delete assignments for
   * @returns Number of deleted assignments
   */
  async deleteAssignmentsByOutletAndDate(
    outletId: number,
    date: Date
  ): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.outletEmployee.deleteMany({
      where: {
        outlet_id: outletId,
        assigned_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return result.count;
  }

  /**
   * Get outlet financial summary (income, profit, sold products)
   */
  async getOutletSummarize(
    outletId: number,
    fromDate?: Date,
    toDate?: Date,
    status?: string
  ): Promise<{
    outlet_id: number;
    total_income: number;
    total_expenses: number;
    total_profit: number;
    total_sold_quantity: number;
  }> {
    // Build where clause for orders
    const whereOrder: Record<string, unknown> = {
      outlet_id: outletId,
    };

    if (fromDate || toDate) {
      whereOrder.createdAt = {};
      if (fromDate) {
        (whereOrder.createdAt as Record<string, Date>).gte = fromDate;
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        (whereOrder.createdAt as Record<string, Date>).lte = endOfDay;
      }
    }

    if (status) {
      whereOrder.status = status;
    }

    // Get all order items for this outlet with product details
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: whereOrder,
      },
      include: {
        product: true,
        order: true,
      },
    });

    // Calculate totals
    let totalIncome = 0;
    let totalProfit = 0;
    let totalSoldQuantity = 0;

    for (const item of orderItems) {
      const itemTotal = item.price * item.quantity;
      // Access hpp from product - Product model includes this field
      const productHpp = item.product.hpp as number || 0;
      const itemProfit = ((item.price - productHpp) * item.quantity);

      totalIncome += itemTotal;
      totalProfit += itemProfit;
      totalSoldQuantity += item.quantity;
    }

    return {
      outlet_id: outletId,
      total_income: Math.round(totalIncome),
      total_expenses: 0,
      total_profit: Math.round(totalProfit),
      total_sold_quantity: totalSoldQuantity,
    };
  }
}

