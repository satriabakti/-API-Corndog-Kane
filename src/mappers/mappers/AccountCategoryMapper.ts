import { EntityMapper } from "../EntityMapper";
import { AccountCategoryMapperEntity } from "./AccountCategoryMapperEntity";
import { TAccountCategory } from "../../core/entities/finance/account";

export class AccountCategoryMapper extends EntityMapper<TAccountCategory> {
  constructor() {
    super(AccountCategoryMapperEntity);
  }
}
