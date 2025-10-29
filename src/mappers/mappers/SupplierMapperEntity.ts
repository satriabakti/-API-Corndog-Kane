import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const SupplierMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'phone', entityField: "phone" },
    { dbField: "is_active", entityField: "isActive" },
    { dbField: "address", entityField:"address"},
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [
    {
      dbField: 'materials',
      entityField: 'materials',
      mapper: (rel) => {
        const material = rel as {
          id: number;
          name: string;
          is_active: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
        return {
          id: MapperUtil.mapId(material.id),
          name: material.name,
          isActive: material.is_active,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt,
        };
      },
    },
  ],
};
