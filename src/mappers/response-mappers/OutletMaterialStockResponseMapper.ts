import { TMaterialStockItem } from "../../core/entities/outlet/outlet";

/**
 * Mapper for outlet material stock items
 * Converts database records to response format
 */
export class OutletMaterialStockResponseMapper {
  /**
   * Convert a single outlet material stock item to list response format
   */
  static toListResponse(item: TMaterialStockItem): TMaterialStockItem {
    return {
      date: item.date,
      material_id: item.material_id,
      material_name: item.material_name,
      first_stock: item.first_stock,
      stock_in: item.stock_in,
      used_stock: item.used_stock,
      remaining_stock: item.remaining_stock,
    };
  }

  /**
   * Convert array of outlet material stock items to list response format
   */
  static toBatchResponse(items: TMaterialStockItem[]): TMaterialStockItem[] {
    return items.map((item) => this.toListResponse(item));
  }
}
