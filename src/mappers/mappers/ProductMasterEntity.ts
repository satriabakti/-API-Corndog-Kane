import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Product entity mapping configuration
 */
export const ProductMasterMapperEntity: EntityMapConfig = {
	fields: [
		{
			dbField: "id",
			entityField: "id",
			transform: (v) => MapperUtil.mapId(v as number),
		},
		{ dbField: "name", entityField: "name" },
		{ dbField: "createdAt", entityField: "createdAt" },
		{ dbField: "updatedAt", entityField: "updatedAt" },
	],
	relations: [
		{
			dbField: "category",
			entityField: "category", // Internal field, will be expanded below
			mapper: (rel) => {
				return rel; // Keep the raw data for expansion
			},
    },
    {
      dbField: "products",
      entityField: "product", // Internal field, will be expanded below
      mapper: (rel) => {
        return rel; // Keep the raw data for expansion
      },
    },
	],
};
