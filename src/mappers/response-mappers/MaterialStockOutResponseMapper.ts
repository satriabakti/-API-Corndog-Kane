import { TMaterialInventoryGetResponse, MaterialInventoryRawData } from "../../core/entities/material/material";

export class MaterialStockOutResponseMapper {
  static toResponse(data: MaterialInventoryRawData): TMaterialInventoryGetResponse {
    return {
      id: data.id,
      date: data.date,
      name: data.name,
      first_stock_count: data.firstStockCount,
      stock_in_count: data.stockInCount,
      stock_out_count: data.stockOutCount,
      current_stock: data.currentStock,
      unit_quantity: data.unitQuantity,
      updated_at: data.updatedAt,
      out_times: data.outTimes,
      in_times: data.inTimes,
    };
  }
}
