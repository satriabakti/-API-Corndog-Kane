import { TOutlet, TOutletWithSettings, TOutletStockItem, TMaterialStockItem } from "../../../core/entities/outlet/outlet";
import { TOutletAssignmentWithRelations } from "../../../core/entities/outlet/assignment";
import { OutletRepository as IOutletRepository } from "../../../core/repositories/outlet";
import Repository from "./Repository";

export default class OutletRepository
  extends Repository<TOutlet>
  implements IOutletRepository {
  constructor() {
    super("outlet");
  }
  async findById(id: number): Promise<TOutletWithSettings | null> {
    const outlet = await this.getModel().findUnique({
      where: { id },
      include:{
        settings: true,
        user: true,
      }
    })
    if (!outlet) return null;
    
    return this.mapper.mapToEntity(outlet) as TOutletWithSettings;
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

  override async create(item: TOutletWithSettings & { userId: number }): Promise<TOutletWithSettings> {
    const outlet = await this.getModel().create({
      data: {
        name: item.name as string,
        is_active: item.isActive as boolean,
        code: item.code as string,
        pic_phone: item.picPhone as string,
        location: item.location as string,
        description: item.description as string | null,
        check_in_time: item.checkinTime,
        check_out_time: item.checkoutTime,
        salary: item.salary as number,
        income_target: item.incomeTarget as number,
        user_id: item.userId as number,
      },
    });
    return this.mapper.mapToEntity(outlet) as TOutletWithSettings;
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
