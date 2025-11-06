import RepositoryInterface from "../../../core/repositories/Repository";
import { TUser } from "../../../core/entities/user/user";
import { TOutlet } from "../../../core/entities/outlet/outlet";
import { TEmployee } from "../../../core/entities/employee/employee";
import { TOutletAssignment } from "../../../core/entities/outlet/assignment";
import { PrismaClient } from "@prisma/client"; 
import PostgresAdapter from "../instance";
import { EntityMapper } from "../../../mappers/EntityMapper";
import { getEntityMapper } from "../../../mappers/EntityMappers";
import { TRole } from "../../../core/entities/user/role";
import { TCategory, TCategoryWithID } from "../../../core/entities/product/category";
import { TSupplier, TSupplierWithID } from "../../../core/entities/suplier/suplier";
import { TMaterial, TMaterialWithID } from "../../../core/entities/material/material";
import { TOutletProductRequest, TOutletMaterialRequest } from "../../../core/entities/outlet/request";
import { TOrder } from "../../../core/entities/order/order";

export type TEntity = TUser | TOutlet | TRole | TEmployee | TOutletAssignment | TCategory | TCategoryWithID | TSupplier | TSupplierWithID | TMaterial | TMaterialWithID | TOutletProductRequest | TOutletMaterialRequest | TOrder;

// Type for Prisma delegate with CRUD operations
interface PrismaDelegate<T> {
  findUnique(args: { 
    where: { id: number };
    include?: Record<string, boolean | object>;
  }): Promise<T | null>;
  findMany(args?: { 
    where?: Record<string, unknown>; 
    skip?: number; 
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    include?: Record<string, boolean | object>;
  }): Promise<T[]>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  create(args: { data: unknown }): Promise<T>;
  update(args: { where: { id: number }; data: unknown }): Promise<T>;
  delete(args: { where: { id: number } }): Promise<T>;
}

// Type for valid Prisma model names
type PrismaModelName = "user" | "role" | "login" | "outlet" | "outletEmployee" | "product" | "productStock" | "productStockDetail" | "productCategory" | "order" | "orderItem" | "employee" | "payroll" | "supplier" | "material" | "materialIn" | "materialOut" | "outletProductRequest" | "outletMaterialRequest";

// Field mapping configuration types
export interface FieldMapping {
  dbField: string;
  entityField: string;
  transform?: (value: unknown) => unknown;
}

export interface RelationMapping {
  dbField: string;
  entityField: string;
  isArray?: boolean;
  mapper: (dbRecord: unknown) => unknown;
}

export interface EntityMapConfig {
  fields: FieldMapping[];
  relations?: RelationMapping[];
}

// Search configuration
export interface SearchConfig {
  field: string;
  value: string;
}

// Pagination result
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = toSnakeCase(key);
      const value = obj[key];
      
      // Convert string dates to Date objects
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        result[snakeKey] = new Date(value);
      }
      // Recursively convert nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[snakeKey] = convertToSnakeCase(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        // Handle arrays of objects
        result[snakeKey] = value.map(item => 
          item && typeof item === 'object' && !(item instanceof Date)
            ? convertToSnakeCase(item as Record<string, unknown>)
            : item
        );
      } else {
        result[snakeKey] = value;
      }
    }
  }
  
  return result;
}

export default abstract class Repository<T extends TEntity> implements RepositoryInterface<T> {
	protected tableName: PrismaModelName;
	protected prisma: PrismaClient;
	protected mapper: EntityMapper<T>;

	constructor(tableName: PrismaModelName, mapConfig?: EntityMapConfig) {
		this.tableName = tableName;
		this.prisma = PostgresAdapter.client as PrismaClient;
		const config = mapConfig || getEntityMapper(tableName);
		this.mapper = new EntityMapper<T>(config);
	}

	protected getModel(): PrismaDelegate<T> {
		
		return this.prisma[this.tableName] as unknown as PrismaDelegate<T>;
	}

	async getById(id: string): Promise<T | null> {
		const model = this.getModel();
		const numericId = parseInt(id, 10);
		
		// Validate that the ID is a valid number
		if (isNaN(numericId)) {
			throw new Error(`Invalid ID format: ${id}`);
		}

		const record = await model.findUnique({
			where: { id: numericId },
			include: this.mapper.getIncludes(),
		} as Parameters<typeof model.findUnique>[0]);
		return record ? this.mapper.mapToEntity(record) : null;
	}

	/**
	 * Get all records with pagination and search
	 * @param page - Page number (1-based)
	 * @param limit - Records per page (if undefined, get all data)
	 * @param search - Search configuration array for LIKE queries
	 * @param filters - Exact match filters
	 * @param orderBy - Sort configuration
	 */
	async getAll(
		page: number = 1,
		limit?: number,
		search?: SearchConfig[],
		filters?: Record<string, unknown>,
		orderBy?: Record<string, 'asc' | 'desc'>
	): Promise<PaginationResult<T>> {
		const model = this.getModel();
		
		// Calculate skip for pagination only if limit is provided
		const skip = limit ? (page - 1) * limit : undefined;
		
		// Build where clause
		const where: Record<string, unknown> = {};
		
		// Add exact match filters
		if (filters) {
			Object.assign(where, filters);
		}
		
		// Add search conditions (LIKE)
		if (search && search.length > 0) {
			const searchConditions = search.map(({ field, value }) => ({
				[field]: {
					contains: value,
					mode: 'insensitive' // Case-insensitive search
				}
			}));
			
			// Use OR condition for multiple search fields
			if (searchConditions.length > 1) {
				where.OR = searchConditions;
			} else {
				Object.assign(where, searchConditions[0]);
			}
		}
		
		// Get total count for pagination
		const total = await model.count({ where });
		
		// Get records - if limit is undefined, get all data without skip/take
		const records = await model.findMany({
			where,
			...(skip !== undefined && { skip }),
			...(limit !== undefined && { take: limit }),
			orderBy: orderBy || { id: 'asc' }, // Default sort by id ascending
			include: this.mapper.getIncludes(), // Include all configured relations
		});
		const data = this.mapper.mapToEntities(records);
		const totalPages = limit ? Math.ceil(total / limit) : 1;
		
		return {
			data,
			total,
			page,
			limit: limit || total, // If no limit, return total count as limit
			totalPages
		};
	}

	async update(id: string, item: Partial<T>): Promise<T> {
		const model = this.getModel();
		const snakeCaseData = convertToSnakeCase(item as Record<string, unknown>);
		const updated = await model.update({
			where: { id: parseInt(id) },
			data: snakeCaseData,
		});
		return this.mapper.mapToEntity(updated);
	}

	async delete(id: string): Promise<void> {
		const model = this.getModel();
		await model.delete({ where: { id: parseInt(id) } });
	}

	async create(item: T): Promise<T> {
		const model = this.getModel();
		const snakeCaseData = convertToSnakeCase(item as Record<string, unknown>);
		const created = await model.create({ data: snakeCaseData });
		return this.mapper.mapToEntity(created);
	}
}
