export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type TTransaction = {
  accountId: number;
  amount: number;
  transactionType: TransactionType;
  description?: string | null;
  transactionDate: Date;
  referenceNumber?: string | null;
};

export type TTransactionWithID = TTransaction & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: number;
    name: string;
    number: string;
  };
};

export type TTransactionCreate = {
  accountId: number;
  amount: number;
  transactionType: TransactionType;
  description?: string;
  transactionDate: Date;
  referenceNumber?: string;
};

export type TTransactionCreateRequest = {
  account_id: number;
  amount: number;
  transaction_type: 'INCOME' | 'EXPENSE';
  description?: string;
  transaction_date: string; // ISO date string
  reference_number?: string;
};

export type TTransactionUpdateRequest = {
  account_id?: number;
  amount?: number;
  transaction_type?: 'INCOME' | 'EXPENSE';
  description?: string;
  transaction_date?: string;
  reference_number?: string;
};

export type TTransactionGetResponse = {
  id: number;
  date: Date;
  account_id: number;
  account_name: string;
  account_number: string;
  description?: string | null;
  reference_number?: string | null;
  credit: number; // INCOME amount
  debit: number;  // EXPENSE amount
  created_at: Date;
  updated_at: Date;
};

export type TTransactionGroupedByDate = {
  date: string;
  transactions: {
    account_id: number;
    account_name: string;
    account_number: string;
    description?: string | null;
    income_amount: number;
    expense_amount: number;
  }[];
  total_income: number;
  total_expense: number;
};

export type TFinanceReport = {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_income: number;
    total_expense: number;
    balance: number;
  };
  data: TTransactionGroupedByDate[];
};
