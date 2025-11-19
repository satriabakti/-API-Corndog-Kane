import { TAccountCategory, TAccountCategoryGetResponse } from "../../core/entities/finance/account";
import { AccountResponseMapper } from "./AccountResponseMapper";

export class AccountCategoryResponseMapper {
  static toResponse(category: TAccountCategory): TAccountCategoryGetResponse {
    return {
      id: category.id,
      name: category.name,
      description: category.description || null,
      is_active: category.isActive,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    };
  }

  static toListResponse(categories: TAccountCategory[]): TAccountCategoryGetResponse[] {
    return categories.map(category => this.toResponse(category));
  }
}
