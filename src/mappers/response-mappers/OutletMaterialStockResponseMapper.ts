import { TMaterialStockItem } from "../../core/entities/outlet/outlet";

/**
 * Mapper for outlet material stock items
 * Converts database records to response format
 */
export class OutletMaterialStockResponseMapper {
  /**
   * Convert UTC-based date string to GMT+7 date string
   * Repository generates dates in UTC (2025-11-12), but we display in GMT+7 (2025-11-13)
   */
  private static toLocalDateString(utcDateString: string): string {
    // Get current time in GMT+7
    const now = new Date();
    const gmt7Now = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const currentGMT7Date = gmt7Now.toISOString().split('T')[0];
    
    // If input matches today's UTC date, it should be displayed as GMT+7 date
    const utcToday = now.toISOString().split('T')[0];
    if (utcDateString === utcToday) {
      return currentGMT7Date;
    }
    
    // Otherwise, add one day to convert UTC to GMT+7
    const utcDate = new Date(utcDateString + 'T00:00:00.000Z');
    const gmt7Date = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
    const result = gmt7Date.toISOString().split('T')[0];
    
    return result;
  }

  /**
   * Convert a single outlet material stock item to list response format
   */
  static toListResponse(item: TMaterialStockItem): TMaterialStockItem {
    return {
      date: this.toLocalDateString(item.date),
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
