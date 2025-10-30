import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Mapper for Material with stock relations
 * Used for getMaterialWithStocks query result
 */
export const MaterialWithStocksMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id' },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'suplier_id', entityField: 'suplierId' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [
    {
      dbField: 'material_in',
      entityField: 'materialIn',
      isArray: true,
      mapper: (stockIn: unknown) => {
        const stock = stockIn as { id: number; material_id: number; quantity: number; quantity_unit: string; price: number; createdAt: Date; updatedAt: Date };
        return {
          id: stock.id,
          materialId: stock.material_id,
          quantity: stock.quantity,
          quantityUnit: stock.quantity_unit,
          price: stock.price,
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt,
        };
      }
    },
    {
      dbField: 'material_out',
      entityField: 'materialOut',
      isArray: true,
      mapper: (stockOut: unknown) => {
        const stock = stockOut as { id: number; material_id: number; quantity: number; quantity_unit: string; createdAt: Date; updatedAt: Date };
        return {
          id: stock.id,
          materialId: stock.material_id,
          quantity: stock.quantity,
          quantityUnit: stock.quantity_unit,
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt,
        };
      }
    }
  ],
};
