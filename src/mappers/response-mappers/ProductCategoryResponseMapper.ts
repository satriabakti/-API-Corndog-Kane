import { TCategoryGetResponse, TCategoryWithID } from "../../core/entities/product/category";

export class ProductCategoryResponseMapper {
  static toListResponse(category:TCategoryWithID): TCategoryGetResponse {
    return {
      id: category.id,
      name: category.name,
      is_active: category.isActive,
      created_at: category.createdAt.toISOString(),
      updated_at: category.updatedAt.toISOString(),
    };
  }
}
