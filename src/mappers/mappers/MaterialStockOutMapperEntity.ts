import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Mapper for MaterialOut (Stock Out) database records to entity
 * Handles conversion between snake_case DB fields and camelCase entity fields
 */
export const MaterialStockOutMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id' },
    { dbField: 'material_id', entityField: 'materialId' },
    { dbField: 'quantity', entityField: 'quantity' },
    { dbField: 'quantity_unit', entityField: 'quantityUnit' },
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [],
};
