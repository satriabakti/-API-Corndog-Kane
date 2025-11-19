import Repository from "./Repository";
import { TAccountCategory } from "../entities/finance/account";

export interface AccountCategoryRepository extends Repository<TAccountCategory> {
  getAllWithAccounts(): Promise<TAccountCategory[]>;
}
