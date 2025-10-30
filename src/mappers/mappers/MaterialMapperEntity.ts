import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const MaterialMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'name', entityField: 'name' },
    { dbField: 'description', entityField: 'description' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'created_at', entityField: 'createdAt' },
    { dbField: 'updated_at', entityField: 'updatedAt' },
  ],
  relations: [],
};
