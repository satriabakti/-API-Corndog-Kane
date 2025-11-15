import { TMasterProductWithID, TMasterProductGetResponse } from "../../../core/entities/product/masterProduct";

export class MasterProductResponseMapper {
  static toResponse(entity: TMasterProductWithID): TMasterProductGetResponse {
    return {
      id: entity.id,
      name: entity.name,
      category_id: entity.categoryId,
      category: entity.category ? {
        id: entity.category.id,
        name: entity.category.name,
        is_active: entity.category.isActive,
        created_at: entity.category.createdAt.toISOString(),
        updated_at: entity.category.updatedAt.toISOString(),
      } : null,
      is_active: entity.isActive,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}