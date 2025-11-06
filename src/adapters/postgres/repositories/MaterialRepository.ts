import { TMaterial, TMaterialWithID } from "../../../core/entities/material/material";
import { MaterialRepository as IMaterialRepository } from "../../../core/repositories/material";
import Repository from "./Repository";
import { PrismaClient } from "@prisma/client";
import { EntityMapper } from "../../../mappers/EntityMapper";
import { MaterialStockInMapperEntity } from "../../../mappers/mappers/MaterialStockInMapperEntity";
import { MaterialStockOutMapperEntity } from "../../../mappers/mappers/MaterialStockOutMapperEntity";
import { MaterialWithStocksMapperEntity } from "../../../mappers/mappers/MaterialWithStocksMapperEntity";
import type { 
	MaterialStockInEntity,
	MaterialStockOutEntity,
	MaterialWithStocksEntity,
	CreateStockInInput,
	CreateMaterialInput,
	CreateStockOutInput,
	PaginatedMaterialStockIn
} from "../../../core/entities/material/material";

// Re-export types for backward compatibility
export type { 
	MaterialStockInEntity,
	MaterialStockOutEntity,
	MaterialWithStocksEntity,
	CreateStockInInput,
	CreateMaterialInput,
	CreateStockOutInput,
	PaginatedMaterialStockIn
};

export default class MaterialRepository
	extends Repository<TMaterial | TMaterialWithID>
	implements IMaterialRepository
{
	private stockInMapper: EntityMapper<MaterialStockInEntity>;
	private stockOutMapper: EntityMapper<MaterialStockOutEntity>;
	private materialWithStocksMapper: EntityMapper<MaterialWithStocksEntity>;

	constructor() {
		super("material");
		this.stockInMapper = new EntityMapper<MaterialStockInEntity>(MaterialStockInMapperEntity);
		this.stockOutMapper = new EntityMapper<MaterialStockOutEntity>(MaterialStockOutMapperEntity);
		this.materialWithStocksMapper = new EntityMapper<MaterialWithStocksEntity>(MaterialWithStocksMapperEntity);
	}

	getPrismaClient(): PrismaClient {
		return this.prisma;
	}

	// Stock In Operations
	async createStockIn(data: CreateStockInInput): Promise<MaterialStockInEntity> {
		const dbRecord = await this.prisma.materialIn.create({
			data: {
				material_id: data.materialId,
				price: data.price,
				quantity_unit: data.quantityUnit,
				quantity: data.quantity,
			},
			include: {
				material: {
					include: {
						suplier: true,
					},
				},
			},
		});

		// Map DB record to entity using EntityMapper
		return this.stockInMapper.mapToEntity(dbRecord);
	}

	async updateStockIn(id: number, data: CreateStockInInput): Promise<void> {
		await this.prisma.materialIn.update({
			where: { id },
			data: {
				material_id: data.materialId,
				price: data.price,
				quantity_unit: data.quantityUnit,
				quantity: data.quantity,
			},
		});
	}

	async deleteStockIn(id: number): Promise<void> {
		await this.prisma.materialIn.delete({
			where: { id },
		});
	}

	async createMaterial(data: CreateMaterialInput): Promise<{ id: number }> {
		const material = await this.getModel().create({
			data: {
				name: data.name,
				suplier_id: data.suplierId,
				is_active: data.isActive,
			},
		});
		return { id: (material as TMaterialWithID).id };
	}

	// Stock Out Operations
	async createStockOut(data: CreateStockOutInput): Promise<void> {
		await this.prisma.materialOut.create({
			data: {
				material_id: data.materialId,
				quantity: data.quantity,
				quantity_unit: data.quantityUnit,
			},
		});
	}

	async getMaterialWithStocks(materialId: number): Promise<MaterialWithStocksEntity | null> {
		const dbRecord = await this.getModel().findUnique({
			where: { id: materialId },
			include: {
				material_in: true,
				material_out: true,
			},
		});

		if (!dbRecord) return null;

		// Map DB record to entity using EntityMapper
		return this.materialWithStocksMapper.mapToEntity(dbRecord);
	}

	// Buy List Operations
	async getMaterialInList(skip: number, take: number): Promise<PaginatedMaterialStockIn> {
		const [dbRecords, total] = await Promise.all([
			this.prisma.materialIn.findMany({
				skip,
				take,
				include: {
					material: {
						include: {
							suplier: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			this.prisma.materialIn.count(),
		]);

		// Map DB records to entities using EntityMapper
		const data = this.stockInMapper.mapToEntities(dbRecords);

		return { data, total };
	}

	// Stocks List Operations
	async getAllMaterialInRecords(): Promise<MaterialStockInEntity[]> {
		const dbRecords = await this.prisma.materialIn.findMany({
			include: {
				material: true,
			},
			orderBy: {
				createdAt: 'asc',
			},
		});

		// Map DB records to entities using EntityMapper
		return this.stockInMapper.mapToEntities(dbRecords);
	}

	async getAllMaterialOutRecords(): Promise<MaterialStockOutEntity[]> {
		const dbRecords = await this.prisma.materialOut.findMany({
			orderBy: {
				createdAt: 'asc',
			},
		});

		// Map DB records to entities using EntityMapper
		return this.stockOutMapper.mapToEntities(dbRecords);
	}

	async getMaterialStockByOutlet(materialId: number, outletId: number, date: Date): Promise<number> {
		// End of day for the given date
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		// Single query: Get ALL stock_in up to and including this date
		const totalStockInData = await this.prisma.outletMaterialRequest.aggregate({
			where: {
				outlet_id: outletId,
				material_id: +materialId,
				status: 'APPROVED',
				createdAt: {
					lte: endOfDay,
				},
			},
			_sum: {
				approval_quantity: true,
			},
		});
		const totalStockIn = totalStockInData._sum?.approval_quantity || 0;

		// Single query: Get ALL used_stock up to and including this date
		// Note: MaterialOut doesn't have outlet_id, so we calculate globally
		const totalUsedData = await this.prisma.materialOut.aggregate({
			where: {
				material_id: +materialId,
				used_at: {
					lte: endOfDay,
				},
			},
			_sum: {
				quantity: true,
			},
		});
		const totalUsed = totalUsedData._sum?.quantity || 0;

		// Calculate remaining_stock: total received - total used
		const remainingStock = totalStockIn - totalUsed;

		return remainingStock;
	}
}


