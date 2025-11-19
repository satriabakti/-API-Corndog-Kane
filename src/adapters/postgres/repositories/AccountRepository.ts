import { TAccount, TAccountWithID } from "../../../core/entities/finance/account";
import { AccountRepository as IAccountRepository } from "../../../core/repositories/account";
import Repository from "./Repository";
import { AccountMapper } from "../../../mappers/mappers/AccountMapper";

export class AccountRepository
  extends Repository<TAccount | TAccountWithID>
  implements IAccountRepository
{
  constructor() {
    super("account");
    this.mapper = new AccountMapper();
  }

  async create(item: TAccount): Promise<TAccountWithID> {
    const created = await this.prisma.account.create({
      data: {
        name: item.name,
        number: item.number,
        balance: item.balance || 0,
        description: item.description,
        account_category_id: item.accountCategoryId,
        account_type_id: item.accountTypeId,
        is_active: item.isActive ?? true,
      },
      include: {
        account_category: true,
        _count: {
          select: { transactions: true }
        }
      }
    });

    return this.mapper.mapToEntity(created) as TAccountWithID;
  }

  async update(id: string, item: Partial<TAccount>): Promise<TAccountWithID> {
    const numericId = parseInt(id, 10);

    const updated = await this.prisma.account.update({
      where: { id: numericId },
      data: {
        ...(item.name !== undefined && { name: item.name }),
        ...(item.number !== undefined && { number: item.number }),
        ...(item.description !== undefined && { description: item.description }),
        ...(item.accountCategoryId !== undefined && { account_category_id: item.accountCategoryId }),
        ...(item.accountTypeId !== undefined && { account_type_id: item.accountTypeId }),
      },
      include: {
        account_category: true,
        account_type: true,
        _count: {
          select: { transactions: true }
        }
      }
    });

    return this.mapper.mapToEntity(updated) as TAccountWithID;
  }

  async getById(id: string): Promise<TAccountWithID | null> {
    const numericId = parseInt(id, 10);
    
    const account = await this.prisma.account.findUnique({
      where: { id: numericId },
      include: {
        account_category: true,
        account_type: true,
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!account) return null;
    return this.mapper.mapToEntity(account) as TAccountWithID;
  }

  async getAllByCategory(categoryId?: number): Promise<TAccountWithID[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        is_active: true,
        ...(categoryId && { account_category_id: categoryId })
      },
      include: {
        account_category: true,
        account_type: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { number: 'asc' }
    });

    return accounts.map(account => this.mapper.mapToEntity(account) as TAccountWithID);
  }

  async updateBalance(id: number, amount: number, isIncome: boolean): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: {
        balance: {
          increment: isIncome ? amount : -amount
        }
      }
    });
  }

  /**
   * Override getAll to include account_category filter
   */
  async getAll(
    page?: number,
    limit?: number,
    search?: { field: string; value: string }[],
    filters?: Record<string, any>,
    orderBy?: Record<string, 'asc' | 'desc'>
  ) {
    const result = await super.getAll(page, limit, search, filters, orderBy);
    
    // Fetch full data with relations for each account
    const accountsWithRelations = await Promise.all(
      result.data.map(async (account) => {
        const id = (account as TAccountWithID).id;
        return this.getById(id.toString());
      })
    );

    return {
      ...result,
      data: accountsWithRelations.filter(a => a !== null) as TAccountWithID[]
    };
  }
}
