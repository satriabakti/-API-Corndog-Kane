/* eslint-disable @typescript-eslint/no-explicit-any */
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
      console.log('Updating/Creating settings for outlet ID:', outletId);

      for (const setting of item.settings as any) {
        console.log('Processing setting:', setting);
        if (setting.id) {
          // Update existing
          await this.prisma.outletSetting.update({
            where: { id: setting.id },
            data: {
              check_in_time: setting.checkin_time,
              check_out_time: setting.checkout_time,
              salary: setting.salary,
              day: { set: setting.days as DAY[] },
            },
          });
        } else {
          // Create new
          await this.prisma.outletSetting.create({
			data: {
				outlet_id: outletId,
				check_in_time: setting.checkin_time,
				check_out_time: setting.checkout_time,
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
   * Returns the first available setting for the day (flexible time matching)
   */
  async getSettingForCheckin(outletId: number, day: string, currentTime: string): Promise<TOutletSettingEntity | null> {
    const settings = await this.prisma.outletSetting.findMany({
      where: {
        outlet_id: outletId,
        day: { has: day as DAY },
      },
      orderBy: {
        check_in_time: 'asc',
      },
    });
    
    if (settings.length === 0) return null;
    
    // Return the first available setting (allows checkin at any time for the day)
    const setting = settings[0];
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
    // Get today's date for filtering - only show today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Get products that have activity today (approved requests or orders)
    const productsWithActivity = await this.prisma.$queryRaw<Array<{ product_id: number; product_name: string }>>`
      SELECT DISTINCT p.id as product_id, pm.name as product_name
      FROM product_menus p
      INNER JOIN product_masters pm ON p.product_master_id = pm.id
      WHERE pm.is_active = true
        AND p.is_active = true
        AND (
          -- Has APPROVED product requests today
          EXISTS (
            SELECT 1 FROM outlet_requests opr
            WHERE opr.product_id = p.id
              AND opr.outlet_id = ${outletId}
              AND opr.status = 'APPROVED'
              AND DATE(opr."updatedAt") = ${todayStr}::date
          )
          OR
          -- Has orders today
          EXISTS (
            SELECT 1 FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
              AND o.outlet_id = ${outletId}
              AND DATE(o."createdAt") = ${todayStr}::date
          )
        )
      ORDER BY p.id ASC
    `;
    
    // If no products with activity, return empty
    if (productsWithActivity.length === 0) {
      return { stocks: [], total: 0 };
    }

    // Build array of today's data only
    const allRecords: TOutletStockItem[] = [];

    // Get yesterday's date for calculating first_stock
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (const product of productsWithActivity) {
      // Calculate first_stock from yesterday's remaining stock
      const yesterdayStockIn = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM(opr."approval_quantity"), 0)::bigint as total
        FROM "outlet_requests" opr
        WHERE opr."product_id" = ${product.product_id}
          AND opr."outlet_id" = ${outletId}
          AND opr."status" = 'APPROVED'
          AND opr."is_active" = true
          AND DATE(opr."updatedAt") = ${yesterdayStr}::date
      `;
      const yesterdayIn = Number(yesterdayStockIn[0]?.total || 0);

      const yesterdaySold = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM(oi."quantity"), 0)::bigint as total
        FROM "order_items" oi
        INNER JOIN "orders" o ON oi."order_id" = o."id"
        WHERE oi."product_id" = ${product.product_id}
          AND o."outlet_id" = ${outletId}
          AND o."is_active" = true
          AND oi."is_active" = true
          AND DATE(o."createdAt") = ${yesterdayStr}::date
      `;
      const yesterdayOut = Number(yesterdaySold[0]?.total || 0);

      // First stock is yesterday's stock_in minus yesterday's sold
      const firstStock = yesterdayIn - yesterdayOut;

      // Calculate stock_in (approved outlet requests for today)
      const stockInResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM(opr."approval_quantity"), 0)::bigint as total
        FROM "outlet_requests" opr
        WHERE opr."product_id" = ${product.product_id}
          AND opr."outlet_id" = ${outletId}
          AND opr."status" = 'APPROVED'
          AND opr."is_active" = true
          AND DATE(opr."updatedAt") = ${todayStr}::date
      `;
      const stockIn = Number(stockInResult[0]?.total || 0);

      // Calculate sold_stock (order items for today)
      const soldStockResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM(oi."quantity"), 0)::bigint as total
        FROM "order_items" oi
        INNER JOIN "orders" o ON oi."order_id" = o."id"
        WHERE oi."product_id" = ${product.product_id}
          AND o."outlet_id" = ${outletId}
          AND o."is_active" = true
          AND oi."is_active" = true
          AND DATE(o."createdAt") = ${todayStr}::date
      `;
      const soldStock = Number(soldStockResult[0]?.total || 0);

      // Calculate remaining_stock
      const remainingStock = firstStock + stockIn - soldStock;

      allRecords.push({
        date: todayStr,
        product_id: product.product_id,
        product_name: product.product_name,
        first_stock: firstStock,
        stock_in: stockIn,
        sold_stock: soldStock,
        remaining_stock: remainingStock,
      });
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
    // Get today's date for filtering - only show today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Get materials that have activity today (approved requests or orders)
    const materialsWithActivity = await this.prisma.$queryRaw<Array<{ material_id: number; material_name: string }>>`
      SELECT DISTINCT m.id as material_id, m.name as material_name
      FROM materials m
      WHERE m.is_active = true
        AND (
          -- Has APPROVED material requests today
          EXISTS (
            SELECT 1 FROM outlet_material_requests omr
            WHERE omr.material_id = m.id
              AND omr.outlet_id = ${outletId}
              AND omr.status = 'APPROVED'
              AND DATE(omr."updatedAt") = ${todayStr}::date
          )
          OR
          -- Has material usage from orders today
          EXISTS (
            SELECT 1 FROM order_material_usages omu
            INNER JOIN orders o ON omu.order_id = o.id
            WHERE omu.material_id = m.id
              AND o.outlet_id = ${outletId}
              AND DATE(o."createdAt") = ${todayStr}::date
          )
        )
      ORDER BY m.id ASC
    `;
    
    // If no materials with activity, return empty
    if (materialsWithActivity.length === 0) {
      return { stocks: [], total: 0 };
    }

    // Build array of today's data only
    const allRecords: TMaterialStockItem[] = [];

    // Get yesterday's date for calculating first_stock
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (const material of materialsWithActivity) {
      // Calculate first_stock from yesterday's remaining stock
      const yesterdayStockIn = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM("approval_quantity"), 0)::bigint as total
        FROM "outlet_material_requests"
        WHERE "material_id" = ${material.material_id}
          AND "outlet_id" = ${outletId}
          AND "status" = 'APPROVED'
          AND "is_active" = true
          AND DATE("updatedAt") = ${yesterdayStr}::date
      `;
      const yesterdayIn = Number(yesterdayStockIn[0]?.total || 0);

      const yesterdayUsed = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM(omu."quantity"), 0)::bigint as total
        FROM "order_material_usages" omu
        INNER JOIN "orders" o ON omu."order_id" = o."id"
        WHERE omu."material_id" = ${material.material_id}
          AND o."outlet_id" = ${outletId}
          AND DATE(omu."used_at") = ${yesterdayStr}::date
      `;
      const yesterdayOut = Number(yesterdayUsed[0]?.total || 0);

      // First stock is yesterday's stock_in minus yesterday's used
      const firstStock = yesterdayIn - yesterdayOut;

      // Calculate stock_in (approved outlet material requests for today)
      const stockInResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM("approval_quantity"), 0)::bigint as total
        FROM "outlet_material_requests"
        WHERE "material_id" = ${material.material_id}
          AND "outlet_id" = ${outletId}
          AND "status" = 'APPROVED'
          AND "is_active" = true
          AND DATE("updatedAt") = ${todayStr}::date
      `;
      const stockIn = Number(stockInResult[0]?.total || 0);

      // Calculate used_stock from order_material_usages (outlet-specific)
      const usedStockResult = await this.prisma.$queryRaw<Array<{ total: bigint | null }>>`
        SELECT COALESCE(SUM(omu."quantity"), 0)::bigint as total
        FROM "order_material_usages" omu
        INNER JOIN "orders" o ON omu."order_id" = o."id"
        WHERE omu."material_id" = ${material.material_id}
          AND o."outlet_id" = ${outletId}
          AND DATE(omu."used_at") = ${todayStr}::date
      `;
      const usedStock = Number(usedStockResult[0]?.total || 0);

      // Calculate remaining_stock
      const remainingStock = firstStock + stockIn - usedStock;

      allRecords.push({
        date: todayStr,
        material_id: material.material_id,
        material_name: material.material_name,
        first_stock: firstStock,
        stock_in: stockIn,
        used_stock: usedStock,
        remaining_stock: remainingStock,
      });
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
    outlet_name: string;
    outlet_code: string;
    total_income: number;
    total_expenses: number;
    total_profit: number;
    total_sold_quantity: number;
  }> {
    // Get outlet details
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      select: { name: true, code: true }
    });

    if (!outlet) {
      throw new Error(`Outlet with ID ${outletId} not found`);
    }

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
      outlet_name: outlet.name,
      outlet_code: outlet.code,
      total_income: Math.round(totalIncome),
      total_expenses: 0,
      total_profit: Math.round(totalProfit),
      total_sold_quantity: totalSoldQuantity,
    };
  }
}

