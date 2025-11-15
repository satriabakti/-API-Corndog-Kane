import { TMasterProduct, TMasterProductWithID } from "../../../core/entities/product/masterProduct";
import { MasterProductRepository as IMasterProductRepository } from "../../../core/repositories/masterProduct";
import Repository from "./Repository";
import { ProductMaster } from "@prisma/client";
import {  TProductInventoryCreateRequest, TProductInventoryUpdateRequest } from "../../../core/entities/product/productInventory";

export class MasterProductRepository
	extends Repository<TMasterProduct | TMasterProductWithID>
	implements IMasterProductRepository
{
	constructor() {
		super("productMaster");
	}

	async create(item: TMasterProduct): Promise<TMasterProductWithID> {
		const created = await this.prisma.productMaster.create({
			data: {
				name: item.name,
				category_id: item.categoryId,
				is_active: item.isActive ?? true,
			},
		});

		return this.mapToEntity(created);
	}

	async update(id: string, item: Partial<TMasterProduct>): Promise<TMasterProductWithID> {
		const numericId = parseInt(id, 10);
		const updated = await this.prisma.productMaster.update({
			where: { id: numericId },
			data: {
				...(item.name !== undefined && { name: item.name }),
				...(item.categoryId !== undefined && { category_id: item.categoryId }),
				...(item.isActive !== undefined && { is_active: item.isActive }),
			},
		});

		return this.mapToEntity(updated);
	}

	async delete(id: string): Promise<void> {
		await this.prisma.productMaster.delete({
			where: { id: parseInt(id, 10) },
		});
	}

	async getById(id: string): Promise<TMasterProductWithID | null> {
		const record = await this.prisma.productMaster.findUnique({
			where: { id: parseInt(id, 10) },
			include: {
				category: true,
			},
		});

		return record ? this.mapToEntity(record) : null;
	}

	// async getAll(): Promise<TMasterProductWithID[]> {
	// 	const records = await this.prisma.productMaster.findMany({
	// 		where: { is_active: true },
	// 		include: {
	// 			category: true,
	// 		},
	// 	});

	// 	return records.map(record => this.mapToEntity(record));
	// }

	// Product Inventory methods
	async getProductInventory(masterProductId: number) {
		const inventories = await this.prisma.productInventory.findMany({
			where: {
				product_id: masterProductId,
			},
			include: {
				material: true,
			},
		});

		return inventories.map(inventory => ({
			id: inventory.id,
			productId: inventory.product_id,
			quantity: inventory.quantity,
			materialId: inventory.material_id,
			material: {
				id: inventory.material.id,
				name: inventory.material.name,
				suplier_id: inventory.material.suplier_id,
				is_active: inventory.material.is_active,
				created_at: inventory.material.createdAt.toISOString(),
				updated_at: inventory.material.updatedAt.toISOString(),
			},
			createdAt: inventory.createdAt,
			updatedAt: inventory.updatedAt,
		}));
	}

	async createProductInventory(data: TProductInventoryCreateRequest) {
		const created = await this.prisma.productInventory.create({
			data: {
				product_id: data.product_id,
				quantity: data.quantity,
				material_id: data.material_id,
			},
			include: {
				material: true,
			},
		});

		return {
			id: created.id,
			productId: created.product_id,
			quantity: created.quantity,
			materialId: created.material_id,
			material: {
				id: created.material.id,
				name: created.material.name,
				suplier_id: created.material.suplier_id,
				is_active: created.material.is_active,
				created_at: created.material.createdAt.toISOString(),
				updated_at: created.material.updatedAt.toISOString(),
			},
			createdAt: created.createdAt,
			updatedAt: created.updatedAt,
		};
	}

	async updateProductInventory(masterProductId: number, materialId: number, data: TProductInventoryUpdateRequest) {
		// Find the existing product inventory record by product_id and material_id
		const existing = await this.prisma.productInventory.findFirst({
			where: {
				product_id: masterProductId,
				material_id: materialId,
			}
		});
		
		if (!existing) {
			throw new Error(`Product inventory for product ${masterProductId} and material ${materialId} not found`);
		}
		
		const updated = await this.prisma.productInventory.update({
			where: {
				id: existing.id, // Use the primary key
			},
			data: {
				...(data.quantity !== undefined && { quantity: data.quantity }),
			},
			include: {
				material: true,
			},
		});

		return {
			id: updated.id,
			productId: updated.product_id,
			quantity: updated.quantity,
			materialId: updated.material_id,
			material: {
				id: updated.material.id,
				name: updated.material.name,
				suplier_id: updated.material.suplier_id,
				is_active: updated.material.is_active,
				created_at: updated.material.createdAt.toISOString(),
				updated_at: updated.material.updatedAt.toISOString(),
			},
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		};
	}

	private mapToEntity(record: ProductMaster & { category?: any }): TMasterProductWithID {
		return {
			id: record.id,
			name: record.name,
			categoryId: record.category_id,
			category: record.category ? {
				id: record.category.id,
				name: record.category.name,
				is_active: record.category.is_active,
				created_at: record.category.createdAt,
				updated_at: record.category.updatedAt,
			} : null,
			isActive: record.is_active,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
		};
	}
}