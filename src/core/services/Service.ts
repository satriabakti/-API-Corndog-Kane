import { TOutlet } from "../entities/outlet/outlet";
import { TRole } from "../entities/user/role";
import { TUser } from "../entities/user/user";
import Repository, { PaginationResult, SearchConfig } from "../repositories/Repository";

type TEntity = TUser | TOutlet | TRole;

export class Service<T extends TEntity> {
	repository: Repository<T>;
	constructor(repository: Repository<T>) {
		this.repository = repository;
	}
	async findById(id: string): Promise<T | null> {
		return this.repository.getById(id);
	}
	
	async findAll(
		page?: number,
		limit?: number,
		search?: SearchConfig[],
		filters?: Record<string, unknown>,
		orderBy?: Record<string, 'asc' | 'desc'>
	): Promise<PaginationResult<T>> {
		return this.repository.getAll(page, limit, search, filters, orderBy);
	}
	
	async create(item: T): Promise<T> {
		return this.repository.create(item);
	}
	
	async update(id: string, item: Partial<T>): Promise<T> {
		return this.repository.update(id, item);
	}
	
	async delete(id: string): Promise<void> {
		return this.repository.delete(id);
	}
}