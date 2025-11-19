import { PrismaClient } from "@prisma/client";
import { IAccountTypeRepository } from "../../../core/repositories/accountType";
import { AccountType } from "../../../core/entities/finance/accountType";
import { AccountTypeMapper } from "../../../mappers/mappers/AccountTypeMapper";
import PostgresAdapter from "../instance";

export class AccountTypeRepository implements IAccountTypeRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = PostgresAdapter.client;
  }

  async findAll(): Promise<AccountType[]> {
    const accountTypes = await this.prisma.accountType.findMany({
      where: { is_active: true },
      include: {
        account_category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return accountTypes.map(AccountTypeMapper.toDomain);
  }

  async findById(id: number): Promise<AccountType | null> {
    const accountType = await this.prisma.accountType.findUnique({
      where: { id },
      include: {
        account_category: true,
      },
    });

    return accountType ? AccountTypeMapper.toDomain(accountType) : null;
  }
}
