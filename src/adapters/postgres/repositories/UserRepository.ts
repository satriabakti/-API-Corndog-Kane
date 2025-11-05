import { TUser} from "../../../core/entities/user/user";
import { UserRepository as IUserRepository } from "../../../core/repositories/user";
import Repository from "./Repository";

export default class UserRepository
	extends Repository<TUser>
	implements IUserRepository
{
	constructor() {
		super("user");
	}

	async findByUsername(username: string): Promise<TUser | null> {
		const user = await this.prisma.user.findUnique({
			where: { username },
			include: { role: true, outlets: true },
		});

		if (!user) return null;

		return this.mapper.mapToEntity(user) as TUser;
	}

	async updatePassword(id: number, newPassword: string): Promise<void> {
		await this.getModel().update({
			where: { id },
			data: { password: newPassword },
		});
	}

	async createLoginHistory(
		userId: number,
		ipAddress: string,
		userAgent: string
	): Promise<void> {
		await this.prisma.login.create({
			data: {
				user_id: userId,
				ip_address: ipAddress,
				user_agent: userAgent,
			},
		});
	}
}