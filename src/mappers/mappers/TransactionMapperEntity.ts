import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const TransactionMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'account_id', entityField: 'accountId' },
    { dbField: 'amount', entityField: 'amount' },
    { dbField: 'transaction_type', entityField: 'transactionType' },
    { dbField: 'description', entityField: 'description', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'transaction_date', entityField: 'transactionDate', transform: (v) => MapperUtil.mapDate(v as Date) },
    { dbField: 'reference_number', entityField: 'referenceNumber', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'createdAt', entityField: 'createdAt', transform: (v) => MapperUtil.mapDate(v as Date) },
    { dbField: 'updatedAt', entityField: 'updatedAt', transform: (v) => MapperUtil.mapDate(v as Date) },
  ],
  relations: [
    {
      dbField: 'account',
      entityField: 'account',
      include: {
        select: {
          id: true,
          name: true,
          number: true
        }
      },
      mapper: (rel: any) => {
        if (!rel) return undefined;
        return {
          id: MapperUtil.mapId(rel.id),
          name: rel.name,
          number: rel.number,
        };
      },
    },
  ],
};
