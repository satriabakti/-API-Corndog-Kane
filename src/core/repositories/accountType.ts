import { AccountType } from "../entities/finance/accountType";

export interface IAccountTypeRepository {
  findAll(): Promise<AccountType[]>;
  findById(id: number): Promise<AccountType | null>;
}
