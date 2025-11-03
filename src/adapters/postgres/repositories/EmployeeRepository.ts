import { TEmployee } from "../../../core/entities/employee/employee";
import { EmployeeRepository as IEmployeeRepository } from "../../../core/repositories/employee";
import Repository from "./Repository";

export default class EmployeeRepository
  extends Repository<TEmployee>
  implements IEmployeeRepository
{
  constructor() {
    super("employee");
  }

  async getSchedules() {
    const schedules = await this.prisma.outletEmployee.findMany({
      where: {
        is_active: true,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            phone: true,
            nik: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
            location: true,
            check_in_time: true,
            check_out_time: true,
          },
        },
      },
      orderBy: {
        assigned_at: 'desc',
      },
    });

    return schedules;
  }
}
