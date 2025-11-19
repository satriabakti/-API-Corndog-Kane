import { EntityMapper } from "../EntityMapper";
import { AccountMapperEntity } from "./AccountMapperEntity";
import { TAccount, TAccountWithID } from "../../core/entities/finance/account";

export class AccountMapper extends EntityMapper<TAccount | TAccountWithID> {
  constructor() {
    super(AccountMapperEntity);
  }
}
