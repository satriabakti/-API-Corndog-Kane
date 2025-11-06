import OutletRepository from "../../adapters/postgres/repositories/OutletRepository";
import UserRepository from "../../adapters/postgres/repositories/UserRepository";
import { TOutlet, TOutletCreate, TOutletUpdate, TOutletWithSettings, TOutletProductStockResponse, TOutletMaterialStockResponse } from "../entities/outlet/outlet";
import { TOutletAssignmentWithRelations } from "../entities/outlet/assignment";
import { TUser, TUserCreate } from "../entities/user/user";
import { Service } from "./Service";

export default class OutletService extends Service<TOutlet> {
	declare repository: OutletRepository;
	declare userRepository: UserRepository;

	constructor(repository: OutletRepository) {
		super(repository);
		this.userRepository = new UserRepository();
	}
	async createOutlet(item: TOutletCreate ): Promise<TOutlet | TOutletWithSettings> {
		const {
			name,
			isActive,
			code,
			picPhone,
			location,
			salary,
			userId,
			user,
			description,
      checkinTime,
      incomeTarget,
			checkoutTime,
		} = item as TOutletCreate;
    let userIdToUse: number = userId ? userId : 0;
    if (user && userId == 0) {
      
      const userData = {
        name: user.name,
        username: user.username,
        password: user.password,
        role_id: user.role_id,
      } as TUserCreate;
			const newUser = await this.userRepository.create(userData as TUser) as TUser;
			userIdToUse = +newUser.id;
		}

		const newOutlet =  this.repository.create({
			name,
			isActive,
			code,
			picPhone,
			location,
			description,
			checkinTime: checkinTime,
      checkoutTime: checkoutTime,
      incomeTarget,
			salary,
			userId: userIdToUse || 1,
    } as TOutletWithSettings & { userId: number });
    return newOutlet;
  }
  async updateOutlet(id: number, item: Partial<TOutletUpdate>): Promise<TOutlet | TOutletWithSettings | null> {
	// Remove null values so the payload matches Partial<TOutletWithSettings> (which doesn't allow null for some fields)
	const sanitized = Object.fromEntries(
	  Object.entries(item).filter(([, v]) => v !== null)
	) as Partial<TOutletWithSettings>;

	const updatedOutlet = await this.repository.update(id.toString(), sanitized);
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