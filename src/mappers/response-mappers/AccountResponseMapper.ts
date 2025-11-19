import { TAccountWithID, TAccountGetResponse } from "../../core/entities/finance/account";

export class AccountResponseMapper {
  static toResponse(account: TAccountWithID, includeCategory: boolean = true): TAccountGetResponse {
    return {
      id: account.id,
      name: account.name,
      number: account.number,
      balance: account.balance,
      description: account.description || null,
      account_category: includeCategory && account.accountCategory ? {
        id: account.accountCategory.id,
        name: account.accountCategory.name,
        description: account.accountCategory.description || null,
      } : undefined,
      account_type: account.accountType ? {
        id: account.accountType.id,
        name: account.accountType.name,
        description: account.accountType.description || null,
      } : undefined,
      transaction_count: account._count?.transactions || 0,
      is_active: account.isActive,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    };
  }

  static toListResponse(accounts: TAccountWithID[], includeCategory: boolean = true): TAccountGetResponse[] {
    return accounts.map(account => this.toResponse(account, includeCategory));
  }

  static toMinimalResponse(account: TAccountWithID): Omit<TAccountGetResponse, 'account_category'> {
    return {
      id: account.id,
      name: account.name,
      number: account.number,
      balance: account.balance,
      description: account.description || null,
      account_type: account.accountType ? {
        id: account.accountType.id,
        name: account.accountType.name,
        description: account.accountType.description || null,
      } : undefined,
      transaction_count: account._count?.transactions || 0,
      is_active: account.isActive,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    };
  }
}
