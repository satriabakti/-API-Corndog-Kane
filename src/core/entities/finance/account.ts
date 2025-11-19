export type TAccount = {
  name: string;
  number: string;
  balance: number;
  description?: string | null;
  accountCategoryId: number;
  accountTypeId: number;
  isActive: boolean;
};

export type TAccountWithID = TAccount & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  accountCategory?: TAccountCategory;
  accountType?: TAccountType;
  _count?: {
    transactions: number;
  };
};

export type TAccountCreate = Omit<TAccount, 'isActive' | 'balance'> & {
  isActive?: boolean;
  balance?: number;
};

export type TAccountUpdate = Partial<Omit<TAccount, 'balance' | 'isActive'>>;

export type TAccountCreateRequest = {
  name: string;
  number: string;
  account_category_id: number;
  account_type_id: number;
  description?: string;
};

export type TAccountUpdateRequest = {
  name?: string;
  number?: string;
  account_category_id?: number;
  account_type_id?: number;
  description?: string;
};

export type TAccountGetResponse = {
  id: number;
  name: string;
  number: string;
  balance: number;
  description?: string | null;
  account_category?: {
    id: number;
    name: string;
    description?: string | null;
  };
  account_type?: {
    id: number;
    name: string;
    description?: string | null;
  };
  transaction_count?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TAccountCategory = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  accounts?: TAccountWithID[];
};

export type TAccountType = {
  id: number;
  name: string;
  description?: string | null;
  accountCategoryId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TAccountCategoryCreate = {
  name: string;
  description?: string;
};

export type TAccountCategoryGetResponse = {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
