import { TMaterialStockInGetResponse, MaterialStockInRawData } from "../../core/entities/material/material";

export class MaterialStockInResponseMapper {
  static toResponse(data: MaterialStockInRawData): TMaterialStockInGetResponse {
    return {
      id: data.id,
      date: data.received_at.toISOString(),
      suplier_name: data.material.suplier.name,
      suplier_id: data.material.suplier_id,
      material_id: data.material_id,
      material_name: data.material.name,
      quantity: data.quantity,
      unit_quantity: data.quantity_unit,
      price: data.price,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };
  }
}
