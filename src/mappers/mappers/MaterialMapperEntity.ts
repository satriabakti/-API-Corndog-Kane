import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const MaterialMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id' },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'suplier_id', entityField: 'suplierId' },
    { dbField: 'description', entityField: 'description' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'created_at', entityField: 'createdAt' },
    { dbField: 'updated_at', entityField: 'updatedAt' },
  ],
  relations: [],
};
