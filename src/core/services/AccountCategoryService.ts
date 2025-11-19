import { TAccountCategory } from "../entities/finance/account";
import { AccountCategoryRepository } from "../../adapters/postgres/repositories/AccountCategoryRepository";
import { Service } from "./Service";

export default class AccountCategoryService extends Service<TAccountCategory> {
  declare repository: AccountCategoryRepository;

  constructor(repository: AccountCategoryRepository) {
    super(repository);
  }

  async getAll(): Promise<TAccountCategory[]> {
    return this.repository.getAll(1, undefined, undefined, { is_active: true }).then(result => result.data);
  }

  async getAllWithAccounts(): Promise<TAccountCategory[]> {
    return this.repository.getAllWithAccounts();
  }
}
