import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Mapper for MaterialIn (Stock In) database records to entity
 * Handles conversion between snake_case DB fields and camelCase entity fields
 */
export const MaterialStockInMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id' },
    { dbField: 'material_id', entityField: 'materialId' },
    { dbField: 'price', entityField: 'price' },
    { dbField: 'quantity_unit', entityField: 'quantityUnit' },
    { dbField: 'quantity', entityField: 'quantity' },
    { dbField: 'received_at', entityField: 'receivedAt' },
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [
    {
      dbField: 'material',
      entityField: 'material',
      isArray: false,
      mapper: (material: unknown) => {
        const mat = material as { name: string; suplier_id: number; suplier?: { id: number; name: string } };
        return {
          name: mat.name,
          suplierId: mat.suplier_id,
          suplier: mat.suplier ? {
            id: mat.suplier.id,
            name: mat.suplier.name
          } : undefined
        };
      }
    }
  ],
};
