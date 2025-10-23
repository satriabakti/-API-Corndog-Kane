import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Product entity mapping configuration
 */
export const ProductMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'description', entityField: 'description', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'image_path', entityField: 'imagePath' },
    { dbField: 'price', entityField: 'price' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [
    {
      dbField: 'category',
      entityField: 'category',
      mapper: (rel) => {
        const category = rel as {
          id: number;
          name: string;
          is_active: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
        return {
          id: MapperUtil.mapId(category.id),
          name: category.name,
          isActive: category.is_active,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        };
      },
    },
  ],
};
