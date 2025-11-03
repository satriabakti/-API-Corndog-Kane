import { TOutletStockItem } from "../../core/entities/outlet/outlet";

/**
 * Mapper for outlet product stock items
 * Converts database records to response format
 */
export class OutletProductStockResponseMapper {
  /**
   * Convert a single outlet product stock item to list response format
   */
  static toListResponse(item: TOutletStockItem): TOutletStockItem {
    return {
      date: item.date,
      product_id: item.product_id,
      product_name: item.product_name,
      first_stock: item.first_stock,
      stock_in: item.stock_in,
      sold_stock: item.sold_stock,
      remaining_stock: item.remaining_stock,
    };
  }

  /**
   * Convert array of outlet product stock items to list response format
   */
  static toBatchResponse(items: TOutletStockItem[]): TOutletStockItem[] {
    return items.map((item) => this.toListResponse(item));
  }
}
