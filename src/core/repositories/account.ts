import Repository from "./Repository";
import { TAccount, TAccountWithID } from "../entities/finance/account";

export interface AccountRepository extends Repository<TAccount | TAccountWithID> {
  getAllByCategory(categoryId?: number): Promise<TAccountWithID[]>;
  updateBalance(id: number, amount: number, isIncome: boolean): Promise<void>;
}
