import {
  TOutletProductRequest,
  TOutletMaterialRequest,
  TOutletProductRequestResponse,
  TOutletMaterialRequestResponse,
} from "../../core/entities/outlet/request";

/**
 * Map OutletProductRequest entity to API response
 */
export function OutletProductRequestResponseMapper(
  entity: TOutletProductRequest & { product?: { id: number; name: string; price: number } }
): TOutletProductRequestResponse {
  return {
    id: entity.id,
    outlet_id: entity.outletId,
    product_id: entity.productId,
    quantity: entity.quantity,
    approval_quantity: entity.approvalQuantity ?? null,
    status: entity.status,
    is_active: entity.isActive,
    created_at: entity.createdAt.toISOString(),
    updated_at: entity.updatedAt.toISOString(),
    product: entity.product,
  };
}

/**
 * Map OutletMaterialRequest entity to API response
 */
export function OutletMaterialRequestResponseMapper(
  entity: TOutletMaterialRequest & { material?: { id: number; name: string } }
): TOutletMaterialRequestResponse {
  return {
    id: entity.id,
    outlet_id: entity.outletId,
    material_id: entity.materialId,
    quantity: entity.quantity,
    approval_quantity: entity.approvalQuantity ?? null,
    status: entity.status,
    is_active: entity.isActive,
    created_at: entity.createdAt.toISOString(),
    updated_at: entity.updatedAt.toISOString(),
    material: entity.material,
  };
}

/**
 * Map batch of product requests to API response
 */
export function OutletProductRequestBatchResponseMapper(
  entities: TOutletProductRequest[]
): TOutletProductRequestResponse[] {
  return entities.map((entity) => OutletProductRequestResponseMapper(entity as TOutletProductRequest & { product?: { id: number; name: string; price: number, category_name: string } }));
}

/**
 * Map batch of material requests to API response
 */
export function OutletMaterialRequestBatchResponseMapper(
  entities: TOutletMaterialRequest[]
): TOutletMaterialRequestResponse[] {
  return entities.map((entity) => OutletMaterialRequestResponseMapper(entity as TOutletMaterialRequest & { material?: { id: number; name: string } }));
}
