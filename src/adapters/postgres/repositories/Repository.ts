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
import { TProduct, TProductWithID } from "../../../core/entities/product/product";
import { TMasterProduct, TMasterProductWithID } from "../../../core/entities/product/masterProduct";
import { TPayroll } from "../../../core/entities/payroll/payroll";
import { TTransaction, TTransactionWithID } from "../../../core/entities/finance/transaction";

export type TEntity = TUser | TOutlet | TRole | TEmployee | TOutletAssignment | TCategory | TCategoryWithID | TSupplier | TSupplierWithID | TMaterial | TMaterialWithID | TOutletProductRequest | TOutletMaterialRequest | TOrder | TProduct | TProductWithID | TPayroll | TMasterProduct| TMasterProductWithID | TTransaction | TTransactionWithID;

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
type PrismaModelName =
	| "user"
	| "role"
	| "login"
	| "outlet"
	| "outletEmployee"
	| "product"
	| "productStock"
	| "productStockDetail"
	| "productCategory"
	| "order"
	| "orderItem"
	| "employee"
	| "payroll"
	| "supplier"
	| "material"
	| "materialIn"
	| "materialOut"
	| "outletProductRequest"
	| "outletMaterialRequest"
	| "productMaster"
	| "account"
	| "accountCategory"
	| "transaction";

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
  include?: boolean | object; // Support nested includes
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
      
      // Preserve numbers (integers, floats) as-is
      if (typeof value === 'number') {
        result[snakeKey] = value;
      }
      // Preserve booleans as-is
      else if (typeof value === 'boolean') {
        result[snakeKey] = value;
      }
      // Preserve Date objects as-is
      else if (value instanceof Date) {
        result[snakeKey] = value;
      }
      // Convert string dates to Date objects
      else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        result[snakeKey] = new Date(value);
      }
      // Recursively convert nested objects (but not Date objects)
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[snakeKey] = convertToSnakeCase(value as Record<string, unknown>);
      } 
      // Handle arrays
      else if (Array.isArray(value)) {
        result[snakeKey] = value.map(item => 
          item && typeof item === 'object' && !(item instanceof Date)
            ? convertToSnakeCase(item as Record<string, unknown>)
            : item
        );
      } 
      // Default: preserve the value as-is (strings, null, undefined, etc.)
      else {
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
	 * Get all records with pagination, search, and filters
	 * @param page - Current page (default: 1)
	 * @param limit - Records per page (default: 10, undefined returns all)
	 * @param search - LIKE search conditions
	 * @param filters - Exact match filters
	 * @param orderBy - Sort configuration
	 */
	async getAll(
		page: number = 1,
		limit: number = 10,
		search?: SearchConfig[],
		filters?: Record<string, unknown>,
		orderBy?: Record<string, 'asc' | 'desc'>
	): Promise<PaginationResult<T>> {
		const model = this.getModel();
		
		// Calculate skip for pagination
		const skip = (page - 1) * limit;
		
		// Build where clause
		const where: Record<string, unknown> = {};

		// Helper to recursively remove undefined keys from where object
		function sanitizeWhere(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
			if (!obj) return undefined;
			const cleaned: Record<string, unknown> = {};
			for (const k of Object.keys(obj)) {
				const v = obj[k];
				if (v === undefined) continue; // drop undefined values
				// If value is an object, sanitize recursively
				if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
					const nested = sanitizeWhere(v as Record<string, unknown>);
					if (nested && Object.keys(nested).length > 0) {
						cleaned[k] = nested;
					}
				} else if (Array.isArray(v)) {
					// sanitize each element if it's an object, otherwise keep values that are not undefined
					const arr = (v as unknown[]).filter(el => el !== undefined).map(el =>
						(el && typeof el === 'object' && !(el instanceof Date)) ? sanitizeWhere(el as Record<string, unknown>) : el
					).filter(el => el !== undefined && !(typeof el === 'object' && Object.keys(el as Record<string, unknown>).length === 0));
					if (arr.length > 0) cleaned[k] = arr;
				} else {
					cleaned[k] = v;
				}
			}
			return Object.keys(cleaned).length > 0 ? cleaned : undefined;
		}
		
		// Add exact match filters
		if (filters) {
			Object.assign(where, filters);
		}
		
		// Add search conditions (LIKE)
		if (search && search.length > 0) {
			// Filter out search entries with undefined/null field or value
			const validSearch = search.filter(s => s.field && s.field !== 'undefined' && s.value && s.value !== 'undefined');
			
			if (validSearch.length > 0) {
				const searchConditions = validSearch.map(({ field, value }) => ({
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
		}
		
		// Sanitize where before passing to Prisma to avoid invalid undefined keys
		const sanitizedWhere = sanitizeWhere(where);
		// Get total count for pagination
		const total = await model.count({ where: sanitizedWhere });
		console.log(where);
		// Get records with pagination
		const records = await model.findMany({
			where: sanitizedWhere,
			skip,
			take: limit,
			orderBy: orderBy || { id: 'asc' }, // Default sort by id ascending
			include: this.mapper.getIncludes(), // Include all configured relations
		});
		const data = this.mapper.mapToEntities(records);
		const totalPages = Math.ceil(total / limit);
		
		return {
			data,
			total,
			page,
			limit,
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
