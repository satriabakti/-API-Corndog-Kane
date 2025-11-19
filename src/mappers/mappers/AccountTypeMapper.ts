import { AccountType } from "../../core/entities/finance/accountType";

export class AccountTypeMapper {
  static toDomain(raw: any): AccountType {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      account_category_id: raw.account_category_id,
      account_category: raw.account_category ? {
        id: raw.account_category.id,
        name: raw.account_category.name,
        description: raw.account_category.description,
      } : undefined,
      is_active: raw.is_active,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  }

  static toPrisma(domain: AccountType): any {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      account_category_id: domain.account_category_id,
      is_active: domain.is_active,
      created_at: domain.created_at,
      updated_at: domain.updated_at,
    };
  }
}
