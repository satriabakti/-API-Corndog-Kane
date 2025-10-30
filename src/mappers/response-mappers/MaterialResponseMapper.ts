import { TMaterialGetResponse, TMaterialWithID } from "../../core/entities/material/material";

export class MaterialResponseMapper {
  /**
   * Map Material entity to list response format (simplified)
   * Used in findAll endpoints
   */
  static toListResponse(material: TMaterialWithID): TMaterialGetResponse {
    return {
      id: material.id,
      name: material.name,
      supplier_id: material.suplierId,
      is_active: material.isActive ?? true,
      created_at: material.createdAt ?? new Date(),
      updated_at: material.updatedAt ?? new Date(),
    };
  }
}
