import { IAccountTypeRepository } from "../repositories/accountType";
import { AccountType } from "../entities/finance/accountType";

export class AccountTypeService {
  constructor(private readonly accountTypeRepository: IAccountTypeRepository) {}

  async getAllAccountTypes(): Promise<AccountType[]> {
    return await this.accountTypeRepository.findAll();
  }

  async getAccountTypeById(id: number): Promise<AccountType | null> {
    return await this.accountTypeRepository.findById(id);
  }
}
