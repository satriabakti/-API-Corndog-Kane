import { TInventoryBuyListItemEntity } from "../../core/entities/inventory/inventory";
import { TInventoryBuyListItem } from "../../core/entities/inventory/inventory";

/**
 * Maps TInventoryBuyListItemEntity (camelCase) to TInventoryBuyListItem (snake_case)
 */
export class InventoryBuyListResponseMapper {
	static toResponse(entity: TInventoryBuyListItemEntity): TInventoryBuyListItem {
		return {
			id: entity.id,
			item_type: entity.itemType,
			item_id: entity.itemId,
			item_name: entity.itemName,
			quantity: entity.quantity,
			unit_quantity: entity.unitQuantity,
			price: entity.price,
			supplier: {
				id: entity.supplier.id,
				name: entity.supplier.name,
			},
			purchased_at: entity.purchasedAt.toISOString(),
		};
	}

	static toResponseArray(entities: TInventoryBuyListItemEntity[]): TInventoryBuyListItem[] {
		return entities.map(entity => this.toResponse(entity));
	}
}
