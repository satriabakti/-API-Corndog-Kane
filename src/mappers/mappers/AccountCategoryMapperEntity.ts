import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const AccountCategoryMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'description', entityField: 'description', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'createdAt', entityField: 'createdAt', transform: (v) => MapperUtil.mapDate(v as Date) },
    { dbField: 'updatedAt', entityField: 'updatedAt', transform: (v) => MapperUtil.mapDate(v as Date) },
  ],
  relations: [
    {
      dbField: 'accounts',
      entityField: 'accounts',
      isArray: true,
      include: {
        where: { is_active: true },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      },
      mapper: (rel: any) => {
        if (!rel || !Array.isArray(rel)) return [];
        return rel.map((account: any) => ({
          id: MapperUtil.mapId(account.id),
          name: account.name,
          number: account.number,
          balance: account.balance,
          description: MapperUtil.mapNullableString(account.description),
          accountCategoryId: account.account_category_id,
          isActive: account.is_active,
          createdAt: MapperUtil.mapDate(account.createdAt),
          updatedAt: MapperUtil.mapDate(account.updatedAt),
          _count: account._count ? { transactions: account._count.transactions || 0 } : undefined,
        }));
      },
    },
  ],
};
