import { EntityMapper } from "../EntityMapper";
import { TransactionMapperEntity } from "./TransactionMapperEntity";
import { TTransaction, TTransactionWithID } from "../../core/entities/finance/transaction";

export class TransactionMapper extends EntityMapper<TTransaction | TTransactionWithID> {
  constructor() {
    super(TransactionMapperEntity);
  }
}
