/**
 * Outlet Request Entity Types
 * 
 * Following TUser pattern with base types and utility types (Omit, Partial, etc.)
 * Manages product and material requests from outlets
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum OUTLETREQUESTSTATUS {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ============================================================================
// BASE TYPES - Foundation for all outlet request types
// ============================================================================

/**
 * TOutletProductRequest - Base type for product requests
 */
export type TOutletProductRequest = {
  id: number;
  outletId: number;
  productId: number;
  quantity: number;
  approvalQuantity?: number | null;
  status: OUTLETREQUESTSTATUS;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * TOutletMaterialRequest - Base type for material requests
 */
export type TOutletMaterialRequest = {
  id: number;
  outletId: number;
  materialId: number;
  quantity: number;
  approvalQuantity?: number | null;
  status: OUTLETREQUESTSTATUS;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// DERIVED TYPES - Using utility types
// ============================================================================

// Product Request derived types
export type TOutletProductRequestCreate = Omit<
  TOutletProductRequest,
  "id" | "approvalQuantity" | "status" | "isActive" | "createdAt" | "updatedAt"
>;

export type TOutletProductRequestUpdate = Partial<
  Pick<TOutletProductRequest, "productId" | "quantity">
>;

// Material Request derived types
export type TOutletMaterialRequestCreate = Omit<
  TOutletMaterialRequest,
  "id" | "approvalQuantity" | "status" | "isActive" | "createdAt" | "updatedAt"
>;

export type TOutletMaterialRequestUpdate = Partial<
  Pick<TOutletMaterialRequest, "materialId" | "quantity">
>;

// ============================================================================
// BATCH REQUEST TYPES - For creating multiple requests at once
// ============================================================================

/**
 * Batch create request - Entity layer (camelCase)
 */
export type TOutletRequestBatchCreate = {
  outletId: number;
  products?: Array<{
    productId: number;
    quantity: number;
  }>;
  materials?: Array<{
    materialId: number;
    quantity: number;
  }>;
};

/**
 * Batch create request - API layer (snake_case)
 */
export type TOutletRequestBatchCreateRequest = {
  outlet_id: number;
  products?: Array<{
    product_id: number;
    quantity: number;
  }>;
  materials?: Array<{
    material_id: number;
    quantity: number;
  }>;
};

// ============================================================================
// APPROVAL TYPES
// ============================================================================

/**
 * Approval request - Entity layer (camelCase)
 */
export type TOutletRequestApproval = {
  products?: Array<{
    id: number;
    approvalQuantity: number;
  }>;
  materials?: Array<{
    id: number;
    approvalQuantity: number;
  }>;
};

/**
 * Approval request - API layer (snake_case)
 */
export type TOutletRequestApprovalRequest = {
  products?: Array<{
    id: number;
    approval_quantity: number;
  }>;
  materials?: Array<{
    id: number;
    approval_quantity: number;
  }>;
};

// ============================================================================
// RESPONSE TYPES - API layer (snake_case)
// ============================================================================

/**
 * Product request response
 */
export type TOutletProductRequestResponse = {
  id: number;
  outlet_id: number;
  product_id: number;
  quantity: number;
  approval_quantity?: number | null;
  status: OUTLETREQUESTSTATUS;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    price: number;
  };
};

/**
 * Material request response
 */
export type TOutletMaterialRequestResponse = {
  id: number;
  outlet_id: number;
  material_id: number;
  quantity: number;
  approval_quantity?: number | null;
  status: OUTLETREQUESTSTATUS;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  material?: {
    id: number;
    name: string;
  };
};

/**
 * Combined outlet requests response
 */
export type TOutletRequestsResponse = {
  products: TOutletProductRequestResponse[];
  materials: TOutletMaterialRequestResponse[];
};

/**
 * Single request detail response (with outlet info)
 */
export type TOutletRequestDetailResponse = {
  outlet: {
    id: number;
    name: string;
  };
  products: TOutletProductRequestResponse[];
  materials: TOutletMaterialRequestResponse[];
};

// ============================================================================
// UPDATE REQUEST TYPES - API layer (snake_case)
// ============================================================================

export type TOutletProductRequestUpdateRequest = {
  product_id?: number;
  quantity?: number;
};

export type TOutletMaterialRequestUpdateRequest = {
  material_id?: number;
  quantity?: number;
};
