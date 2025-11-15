import { TOutletAssignment } from "../entities/outlet/assignment";
import { TOutlet, TOutletWithSettings } from "../entities/outlet/outlet";
import { TRole } from "../entities/user/role";
import { TUser } from "../entities/user/user";
import { TEmployee } from "../entities/employee/employee";
import Repository, { PaginationResult, SearchConfig, FilterObject } from "../repositories/Repository";
import { TCategory } from "../entities/product/category";
import { TSupplier, TSupplierWithID } from "../entities/suplier/suplier";
import { TMaterial, TMaterialWithID } from "../entities/material/material";
import { TOutletProductRequest, TOutletMaterialRequest } from "../entities/outlet/request";
import { TOrder } from "../entities/order/order";
import { TProduct, TProductWithID } from "../entities/product/product";
import { TMasterProduct, TMasterProductWithID } from "../entities/product/masterProduct";

export type TEntity =
	| TUser
	| TOutlet
	| TRole
	| TEmployee
	| TOutletAssignment
	| TOutletWithSettings
	| TCategory
	| TSupplier
	| TSupplierWithID
	| TMaterial
	| TMaterialWithID
	| TOutletProductRequest
	| TOutletMaterialRequest
	| TOrder
	| TProduct
	| TProductWithID
	| TMasterProduct
	| TMasterProductWithID;

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
		filters?: FilterObject,
		orderBy?: Record<string, 'asc' | 'desc'>,
		outletId?: number
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