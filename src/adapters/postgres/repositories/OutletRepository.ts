import { TOutlet, TOutletWithSettings, TOutletStockItem, TMaterialStockItem, TOutletSettingEntity } from "../../../core/entities/outlet/outlet";
import { TOutletAssignmentWithRelations } from "../../../core/entities/outlet/assignment";
import { OutletRepository as IOutletRepository } from "../../../core/repositories/outlet";
import Repository from "./Repository";
import { DAY } from "@prisma/client";

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
    const products = await this.prisma.product.findMany({
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

    // Build flat array of all date × product combinations
    const allRecords: TOutletStockItem[] = [];

    for (const date of dates) {
      const currentDateObj = new Date(date);
      const startOfDay = new Date(currentDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDateObj);
      endOfDay.setHours(23, 59, 59, 999);

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
        const stockInData = await this.prisma.outletProductRequest.aggregate({
          where: {
            product_id: product.id,
            outlet_id: outletId,
            status: 'APPROVED',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            is_active: true,
          },
          _sum: {
            approval_quantity: true,
          },
        });
        const stockIn = stockInData._sum.approval_quantity || 0;

        // Calculate sold_stock (order items for this day)
        const soldStockData = await this.prisma.orderItem.aggregate({
          where: {
            product_id: product.id,
            order: {
              outlet_id: outletId,
              createdAt: {
                gte: startOfDay,
                lte: endOfDay,
              },
              is_active: true,
            },
            is_active: true,
          },
          _sum: {
            quantity: true,
          },
        });
        const soldStock = soldStockData._sum.quantity || 0;

        
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
      const startOfDay = new Date(currentDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDateObj);
      endOfDay.setHours(23, 59, 59, 999);

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
        const stockInData = await this.prisma.outletMaterialRequest.aggregate({
          where: {
            material_id: material.id,
            outlet_id: outletId,
            status: 'APPROVED',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            is_active: true,
          },
          _sum: {
            approval_quantity: true,
          },
        });
        const stockIn = stockInData._sum.approval_quantity || 0;

        // Calculate used_stock (material out for this day)
        // Note: MaterialOut doesn't have outlet_id, so we get all usage globally
        // If you want outlet-specific tracking, the schema needs to be modified
        const usedStockData = await this.prisma.materialOut.aggregate({
          where: {
            material_id: material.id,
            used_at: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          _sum: {
            quantity: true,
          },
        });
        const usedStock = usedStockData._sum.quantity || 0;

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
}
