export interface AccountType {
  id: number;
  name: string;
  description: string | null;
  account_category_id: number;
  account_category?: {
    id: number;
    name: string;
    description: string | null;
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
