import { TInventoryStockInEntity, TInventoryStockInItemResponse } from "../../core/entities/inventory/inventory";

/**
 * Maps TInventoryStockInEntity (camelCase) to TInventoryStockInItemResponse (snake_case)
 */
export class InventoryStockInResponseMapper {
	static toResponse(entity: TInventoryStockInEntity): TInventoryStockInItemResponse {
		return {
			id: entity.id,
			item_type: entity.itemType,
			item_name: entity.itemName,
			quantity: entity.quantity,
			unit_quantity: entity.unitQuantity,
			price: entity.price,
			supplier: {
				id: entity.supplier.id,
				name: entity.supplier.name,
			},
			current_stock: entity.currentStock,
			created_at: entity.createdAt.toISOString(),
		};
	}

	static toResponseArray(entities: TInventoryStockInEntity[]): TInventoryStockInItemResponse[] {
		return entities.map(entity => this.toResponse(entity));
	}
}
