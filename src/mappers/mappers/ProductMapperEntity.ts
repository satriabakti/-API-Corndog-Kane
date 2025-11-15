import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Product entity mapping configuration
 */
export const ProductMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'description', entityField: 'description', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'image_path', entityField: 'imagePath' },
    { dbField: 'price', entityField: 'price' },
    { dbField: 'hpp', entityField: 'hpp' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [
    {
      dbField: 'product_master',
      entityField: '__product_master__',  // Internal field, will be expanded below
      include: { include: { category: true } },
      mapper: (rel) => {
        return rel; // Keep the raw data for expansion
      },
    },
  ],
};
