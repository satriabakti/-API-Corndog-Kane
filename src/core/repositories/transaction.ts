import Repository from "./Repository";
import { TTransaction, TTransactionWithID } from "../entities/finance/transaction";

export interface TransactionRepository extends Repository<TTransaction | TTransactionWithID> {
  getAllTransactions(): Promise<TTransactionWithID[]>;
  getTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
    accountCategoryIds?: number[]
  ): Promise<TTransactionWithID[]>;
}
