import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * OutletMaterialRequest entity mapping configuration
 */
export const OutletMaterialRequestMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: "id", entityField: "id" },
    { dbField: "outlet_id", entityField: "outletId" },
    { dbField: "material_id", entityField: "materialId" },
    { dbField: "quantity", entityField: "quantity" },
    { dbField: "approval_quantity", entityField: "approvalQuantity" },
    { dbField: "status", entityField: "status" },
    { dbField: "is_active", entityField: "isActive" },
    { dbField: "createdAt", entityField: "createdAt" },
    { dbField: "updatedAt", entityField: "updatedAt" },
  ],
  relations: [
    {
      dbField: "material",
      entityField: "material",
      mapper: (rel) => {
        if (!rel) return null;
        const material = rel as { id: number; name: string };
        return {
          id: material.id,
          name: material.name,
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
