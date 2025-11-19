import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const AccountMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'number', entityField: 'number' },
    { dbField: 'balance', entityField: 'balance' },
    { dbField: 'description', entityField: 'description', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'account_category_id', entityField: 'accountCategoryId' },
    { dbField: 'account_type_id', entityField: 'accountTypeId' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'createdAt', entityField: 'createdAt', transform: (v) => MapperUtil.mapDate(v as Date) },
    { dbField: 'updatedAt', entityField: 'updatedAt', transform: (v) => MapperUtil.mapDate(v as Date) },
  ],
  relations: [
    {
      dbField: 'account_category',
      entityField: 'accountCategory',
      include: true,
      mapper: (rel: any) => {
        if (!rel) return null;
        return {
          id: MapperUtil.mapId(rel.id),
          name: rel.name,
          description: MapperUtil.mapNullableString(rel.description),
          isActive: rel.is_active,
          createdAt: MapperUtil.mapDate(rel.createdAt),
          updatedAt: MapperUtil.mapDate(rel.updatedAt),
        };
      },
    },
    {
      dbField: 'account_type',
      entityField: 'accountType',
      include: true,
      mapper: (rel: any) => {
        if (!rel) return null;
        return {
          id: MapperUtil.mapId(rel.id),
          name: rel.name,
          description: MapperUtil.mapNullableString(rel.description),
          accountCategoryId: rel.account_category_id,
          isActive: rel.is_active,
          createdAt: MapperUtil.mapDate(rel.createdAt),
          updatedAt: MapperUtil.mapDate(rel.updatedAt),
        };
      },
    },
    {
      dbField: '_count',
      entityField: '_count',
      include: { select: { transactions: true } },
      mapper: (rel: any) => {
        if (!rel) return undefined;
        return {
          transactions: rel.transactions || 0
        };
      },
    },
  ],
};
