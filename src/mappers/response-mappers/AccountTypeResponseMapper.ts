import { AccountType } from "../../core/entities/finance/accountType";

export class AccountTypeResponseMapper {
  static toResponse(accountType: AccountType): any {
    return {
      id: accountType.id,
      name: accountType.name,
      description: accountType.description,
      account_category_id: accountType.account_category_id,
      account_category: accountType.account_category ? {
        id: accountType.account_category.id,
        name: accountType.account_category.name,
        description: accountType.account_category.description,
      } : undefined,
      is_active: accountType.is_active,
      created_at: accountType.created_at,
      updated_at: accountType.updated_at,
    };
  }

  static toListResponse(accountTypes: AccountType[]): any {
    return accountTypes.map(this.toResponse);
  }
}
