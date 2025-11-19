import { 
  TTransaction, 
  TTransactionWithID, 
  TTransactionCreate,
  TransactionType,
  TFinanceReport,
  TTransactionGroupedByDate
} from "../entities/finance/transaction";
import { TransactionRepository } from "../../adapters/postgres/repositories/TransactionRepository";
import { AccountRepository } from "../../adapters/postgres/repositories/AccountRepository";
import { Service } from "./Service";
import PostgresAdapter from "../../adapters/postgres/instance";

export default class TransactionService {
  private repository: TransactionRepository;
  private accountRepository: AccountRepository;
  private prisma = PostgresAdapter.client;

  constructor(repository: TransactionRepository, accountRepository: AccountRepository) {
    this.repository = repository;
    this.accountRepository = accountRepository;
  }

  async findById(id: string): Promise<TTransactionWithID | null> {
    return this.repository.getById(id);
  }

  async createTransaction(data: TTransactionCreate): Promise<TTransactionWithID> {
    // Validate account exists
    const account = await this.accountRepository.getById(data.accountId.toString());
    if (!account) {
      throw new Error(`Account with ID ${data.accountId} not found`);
    }

    // Use Prisma transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          account_id: data.accountId,
          amount: data.amount,
          transaction_type: data.transactionType,
          description: data.description,
          transaction_date: data.transactionDate,
          reference_number: data.referenceNumber,
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

      // Update account balance
      const isIncome = data.transactionType === TransactionType.INCOME;
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: isIncome ? data.amount : -data.amount
          }
        }
      });

      // Map to entity
      return this.repository.mapper.mapToEntity(newTransaction) as TTransactionWithID;
    });
  }

  async updateTransaction(id: string, data: Partial<TTransactionCreate>): Promise<TTransactionWithID> {
    // Get existing transaction
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    // If account changed, validate new account
    if (data.accountId && data.accountId !== existing.accountId) {
      const account = await this.accountRepository.getById(data.accountId.toString());
      if (!account) {
        throw new Error(`Account with ID ${data.accountId} not found`);
      }
    }

    // Use Prisma transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Reverse old transaction effect on balance
      const oldIsIncome = existing.transactionType === TransactionType.INCOME;
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: {
            increment: oldIsIncome ? -existing.amount : existing.amount
          }
        }
      });

      // Update transaction
      const newAccountId = data.accountId || existing.accountId;
      const newAmount = data.amount ?? existing.amount;
      const newType = data.transactionType || existing.transactionType;
      const newDate = data.transactionDate || existing.transactionDate;

      const updated = await tx.transaction.update({
        where: { id: parseInt(id) },
        data: {
          ...(data.accountId !== undefined && { account_id: data.accountId }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.transactionType !== undefined && { transaction_type: data.transactionType }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.transactionDate !== undefined && { transaction_date: data.transactionDate }),
          ...(data.referenceNumber !== undefined && { reference_number: data.referenceNumber }),
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

      // Apply new transaction effect on balance
      const newIsIncome = newType === TransactionType.INCOME;
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          balance: {
            increment: newIsIncome ? newAmount : -newAmount
          }
        }
      });

      return this.repository.mapper.mapToEntity(updated) as TTransactionWithID;
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    // Get existing transaction
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    // Use Prisma transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Delete transaction
      await tx.transaction.delete({
        where: { id: parseInt(id) }
      });

      // Reverse transaction effect on balance
      const isIncome = existing.transactionType === TransactionType.INCOME;
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: {
            increment: isIncome ? -existing.amount : existing.amount
          }
        }
      });
    });
  }

  async getAllTransactions(
    page: number = 1,
    limit: number = 10,
    search?: { field: string; value: string }[],
    filters?: Record<string, any>
  ) {
    return this.repository.getAll(page, limit, search, filters);
  }

  async generateReport(
    startDate: Date,
    endDate: Date,
    accountCategoryIds?: number[]
  ): Promise<TFinanceReport> {
    const transactions = await this.repository.getTransactionsByDateRange(
      startDate,
      endDate,
      accountCategoryIds
    );

    // Group by date
    const grouped: Record<string, TTransactionGroupedByDate> = {};

    transactions.forEach(t => {
      const dateKey = t.transactionDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          transactions: [],
          total_income: 0,
          total_expense: 0
        };
      }

      const isIncome = t.transactionType === TransactionType.INCOME;
      
      grouped[dateKey].transactions.push({
        account_id: t.accountId,
        account_name: t.account?.name || '',
        account_number: t.account?.number || '',
        description: t.description || null,
        income_amount: isIncome ? t.amount : 0,
        expense_amount: isIncome ? 0 : t.amount
      });

      grouped[dateKey].total_income += isIncome ? t.amount : 0;
      grouped[dateKey].total_expense += isIncome ? 0 : t.amount;
    });

    // Calculate summary
    const data = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    const summary = data.reduce(
      (acc, day) => ({
        total_income: acc.total_income + day.total_income,
        total_expense: acc.total_expense + day.total_expense,
        balance: 0 // Will calculate after
      }),
      { total_income: 0, total_expense: 0, balance: 0 }
    );

    summary.balance = summary.total_income - summary.total_expense;

    return {
      period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      summary,
      data
    };
  }
}
