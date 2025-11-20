import { TMaterialGetResponse, TMaterialWithID } from "../../core/entities/material/material";

export class MaterialResponseMapper {
  /**
   * Map single material entity to response format
   */
  static toResponse(material: TMaterialWithID & { stock?: number }): TMaterialGetResponse {
    return {
      id: material.id,
      name: material.name,
      supplier_id: material.suplierId,
      is_active: material.isActive ?? true,
      stock: material.stock,
      created_at: material.createdAt ?? new Date(),
      updated_at: material.updatedAt ?? new Date(),
    };
  }

  /**
   * Map array of material entities to list response format
   * Used in findAll endpoints
   */
  static toListResponse(materials: (TMaterialWithID & { stock?: number })[]): TMaterialGetResponse[] {
    return materials.map(material => this.toResponse(material));
  }
}
