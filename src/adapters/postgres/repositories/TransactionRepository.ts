import { TTransaction, TTransactionWithID, TransactionType } from "../../../core/entities/finance/transaction";
import { TransactionRepository as ITransactionRepository } from "../../../core/repositories/transaction";
import { PrismaClient } from "@prisma/client";
import { TransactionMapper } from "../../../mappers/mappers/TransactionMapper";
import PostgresAdapter from "../instance";

export class TransactionRepository implements ITransactionRepository
{
  protected prisma: PrismaClient;
  public mapper: TransactionMapper;
  
  constructor() {
    this.prisma = PostgresAdapter.client;
    this.mapper = new TransactionMapper();
  }

  async create(item: TTransaction): Promise<TTransactionWithID> {
    const created = await this.prisma.transaction.create({
      data: {
        account_id: item.accountId,
        amount: item.amount,
        transaction_type: item.transactionType,
        description: item.description,
        transaction_date: item.transactionDate,
        reference_number: item.referenceNumber,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            number: true
          }
        }
      }
    });

    return this.mapper.mapToEntity(created) as TTransactionWithID;
  }

  async update(id: string, item: Partial<TTransaction>): Promise<TTransactionWithID> {
    const numericId = parseInt(id, 10);

    const updated = await this.prisma.transaction.update({
      where: { id: numericId },
      data: {
        ...(item.accountId !== undefined && { account_id: item.accountId }),
        ...(item.amount !== undefined && { amount: item.amount }),
        ...(item.transactionType !== undefined && { transaction_type: item.transactionType }),
        ...(item.description !== undefined && { description: item.description }),
        ...(item.transactionDate !== undefined && { transaction_date: item.transactionDate }),
        ...(item.referenceNumber !== undefined && { reference_number: item.referenceNumber }),
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            number: true
          }
        }
      }
    });

    return this.mapper.mapToEntity(updated) as TTransactionWithID;
  }

  async getById(id: string): Promise<TTransactionWithID | null> {
    const numericId = parseInt(id, 10);
    
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: numericId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            number: true
          }
        }
      }
    });

    if (!transaction) return null;
    return this.mapper.mapToEntity(transaction) as TTransactionWithID;
  }

  async getAllTransactions(): Promise<TTransactionWithID[]> {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        account: {
          select: {
            id: true,
            name: true,
            number: true
          }
        }
      },
      orderBy: { transaction_date: 'desc' }
    });

    return transactions.map(t => this.mapper.mapToEntity(t) as TTransactionWithID);
  }

  async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
    accountCategoryIds?: number[]
  ): Promise<TTransactionWithID[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        transaction_date: {
          gte: startDate,
          lte: endDate
        },
        ...(accountCategoryIds && accountCategoryIds.length > 0 && {
          account: {
            account_category_id: {
              in: accountCategoryIds
            }
          }
        })
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            number: true,
            account_category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { transaction_date: 'asc' },
        { account: { name: 'asc' } }
      ]
    });

    return transactions.map(t => this.mapper.mapToEntity(t) as TTransactionWithID);
  }

  async getAll(): Promise<{ data: TTransactionWithID[]; total: number; page: number; limit: number; totalPages: number; }> {
    const transactions = await this.getAllTransactions();
    return {
      data: transactions,
      total: transactions.length,
      page: 1,
      limit: transactions.length,
      totalPages: 1
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({
      where: { id: parseInt(id) }
    });
  }
}
