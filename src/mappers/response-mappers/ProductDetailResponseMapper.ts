import { TProductWithID, TProductDetailGetResponse } from "../../../core/entities/product/product";

export class ProductDetailResponseMapper {
  static toResponse(entity: any): TProductDetailGetResponse {
    return {
      id: entity.id,
      name: entity.name,
      image_path: entity.image_path,
      description: entity.description,
      price: entity.price,
      hpp: entity.hpp, // Include HPP field
      category_id: entity.category_id,
      category: entity.category ? {
        id: entity.category.id,
        name: entity.category.name,
        is_active: entity.category.is_active,
        created_at: entity.category.created_at.toISOString ? 
          entity.category.created_at.toISOString() : entity.category.created_at,
        updated_at: entity.category.updated_at.toISOString ? 
          entity.category.updated_at.toISOString() : entity.category.updated_at,
      } : null,
      is_active: entity.is_active,
      created_at: entity.created_at.toISOString ? 
        entity.created_at.toISOString() : entity.created_at,
      updated_at: entity.updated_at.toISOString ? 
        entity.updated_at.toISOString() : entity.updated_at,
      materials: entity.materials || [],
    };
  }
}