import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * OutletProductRequest entity mapping configuration
 */
export const OutletProductRequestMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: "id", entityField: "id" },
    { dbField: "outlet_id", entityField: "outletId" },
    { dbField: "product_id", entityField: "productId" },
    { dbField: "quantity", entityField: "quantity" },
    { dbField: "approval_quantity", entityField: "approvalQuantity" },
    { dbField: "status", entityField: "status" },
    { dbField: "is_active", entityField: "isActive" },
    { dbField: "createdAt", entityField: "createdAt" },
    { dbField: "updatedAt", entityField: "updatedAt" },
  ],
  relations: [
    {
      dbField: "product",
      entityField: "product",
      mapper: (rel) => {
        if (!rel) return null;
        const product = rel as { id: number; name: string; price: number };
        return {
          id: product.id,
          name: product.name,
          price: product.price,
        };
      },
    },
    {
      dbField: "outlet",
      entityField: "outlet",
      mapper: (rel) => {
        if (!rel) return null;
        const outlet = rel as { id: number; name: string };
        return {
          id: outlet.id,
          name: outlet.name,
        };
      },
    },
  ],
};
