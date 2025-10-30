import { TProductStockIn, TProductStockInResponse } from "../../core/entities/product/product";

/**
 * Product Stock In Response Mapper
 * Maps TProductStockIn entity to API response format
 */
export class ProductStockInResponseMapper {
  /**
   * Map TProductStockIn entity to response format
   * Converts camelCase entity to snake_case API response
   */
  static toResponse(entity: TProductStockIn): TProductStockInResponse {
    return {
      id: entity.id,
      item_type: "PRODUCT",
      item_name: entity.productName,
      quantity: entity.quantity,
      unit_quantity: entity.unitQuantity,
      current_stock: entity.currentStock,
      created_at: entity.date.toISOString(),
    };
  }
}
