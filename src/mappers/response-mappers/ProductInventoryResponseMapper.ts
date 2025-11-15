import { TProductInventory, TProductInventoryGetResponse } from "../../../core/entities/product/productInventory";

export class ProductInventoryResponseMapper {
  static toResponse(entity: TProductInventory): TProductInventoryGetResponse {
    return {
      id: entity.id,
      product_id: entity.productId,
      quantity: entity.quantity,
      material_id: entity.materialId,
      material: entity.material,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}