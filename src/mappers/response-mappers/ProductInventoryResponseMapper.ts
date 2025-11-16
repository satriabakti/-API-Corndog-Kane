import { TProductInventory, TProductInventoryGetResponse } from "../../core/entities/product/productInventory";

export class ProductInventoryResponseMapper {
  static toResponse(entity: TProductInventory): TProductInventoryGetResponse {
    console.log('entit',entity);
    return {
      id: entity.id,
      quantity: entity.quantity,
      unit_quantity: entity.unit_quantity,
      material: entity.material ? entity.material : [],
    };
  }
}