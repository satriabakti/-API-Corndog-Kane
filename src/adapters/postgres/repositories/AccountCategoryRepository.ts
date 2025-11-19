import { TAccountCategory } from "../../../core/entities/finance/account";
import { AccountCategoryRepository as IAccountCategoryRepository } from "../../../core/repositories/accountCategory";
import Repository from "./Repository";
import { AccountCategoryMapper } from "../../../mappers/mappers/AccountCategoryMapper";

export class AccountCategoryRepository
  extends Repository<TAccountCategory>
  implements IAccountCategoryRepository
{
  constructor() {
    super("accountCategory");
    this.mapper = new AccountCategoryMapper();
  }

  async create(item: TAccountCategory): Promise<TAccountCategory> {
    const created = await this.prisma.accountCategory.create({
      data: {
        name: item.name,
        description: item.description,
        is_active: item.isActive ?? true,
      }
    });

    return this.mapper.mapToEntity(created);
  }

  async update(id: string, item: Partial<TAccountCategory>): Promise<TAccountCategory> {
    const numericId = parseInt(id, 10);

    const updated = await this.prisma.accountCategory.update({
      where: { id: numericId },
      data: {
        ...(item.name !== undefined && { name: item.name }),
        ...(item.description !== undefined && { description: item.description }),
      }
    });

    return this.mapper.mapToEntity(updated);
  }

  async getAllWithAccounts(): Promise<TAccountCategory[]> {
    const categories = await this.prisma.accountCategory.findMany({
      where: { is_active: true },
      include: {
        accounts: {
          where: { is_active: true },
          include: {
            account_type: true,
            _count: {
              select: { transactions: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories.map(category => this.mapper.mapToEntity(category));
  }
}
