import { TTransactionWithID, TTransactionGetResponse } from "../../core/entities/finance/transaction";

export class TransactionResponseMapper {
  static toResponse(transaction: TTransactionWithID): TTransactionGetResponse {
    const isIncome = transaction.transactionType === 'INCOME';
    
    return {
      id: transaction.id,
      date: transaction.transactionDate,
      account_id: transaction.accountId,
      account_name: transaction.account?.name || '',
      account_number: transaction.account?.number || '',
      description: transaction.description || null,
      reference_number: transaction.referenceNumber || null,
      credit: isIncome ? transaction.amount : 0,
      debit: isIncome ? 0 : transaction.amount,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
    };
  }

  static toListResponse(transactions: TTransactionWithID[]): TTransactionGetResponse[] {
    return transactions.map(transaction => this.toResponse(transaction));
  }
}
