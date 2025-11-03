import { TOutlet, TOutletWithSettings } from "../../../core/entities/outlet/outlet";
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
}