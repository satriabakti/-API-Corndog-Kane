/**
 * Material Domain Types
 * 
 * Semua types disederhanakan dengan base type TMaterial
 * dan memanfaatkan utility types (Omit, Pick, Partial, etc.)
 */

// ============================================================================
// BASE TYPES - Foundation untuk semua material types
// ============================================================================

/**
 * TMaterial - Base type untuk semua material domain
 * Semua type lain derived dari sini menggunakan utility types
 */
export type TMaterial = {
  name: string;
  suplierId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Derived base types
export type TMaterialWithID = TMaterial & { id: number };
export type TMaterialWithStock = TMaterialWithID & { stockQuantity: number };
export type TMaterialCreate = Omit<TMaterial, 'createdAt' | 'updatedAt'>;
export type TMaterialUpdate = Partial<TMaterialCreate>;

// ============================================================================
// API REQUEST/RESPONSE TYPES (snake_case untuk API contract)
// ============================================================================

export type TMaterialGetResponse = Omit<TMaterialWithID, 'isActive' | 'createdAt' | 'updatedAt' | 'suplierId'> & {
  supplier_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TMaterialCreateRequest = Omit<TMaterialCreate, 'isActive'> & {
  is_active?: boolean;
};

export type TMaterialUpdateRequest = Partial<TMaterialCreateRequest>;

// ============================================================================
// STOCK IN TYPES - Derived dari base types
// ============================================================================

export type TMaterialStockInCreateRequest = {
  quantity: number;
  suplier_id: number;
  material_id?: number;
  material?: TMaterialCreate;
  unit_quantity: string;
  price: number;
};

export type TMaterialStockInUpdateRequest = Pick<TMaterialStockInCreateRequest, 'quantity' | 'suplier_id' | 'unit_quantity' | 'price' | 'material_id' | 'material'>;

export type TMaterialStockInGetResponse = {
  id: number;
  date: string;
  suplier_name: string;
  suplier_id: number;
  material_id: number;
  material_name: string;
  quantity: number;
  unit_quantity: string;
  price: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// STOCK OUT TYPES
// ============================================================================

export type TMaterialStockOutCreateRequest = {
  quantity: number;
  material_id: number;
};

export type TMaterialStockOutUpdateRequest = Partial<TMaterialStockOutCreateRequest>;

// ============================================================================
// INVENTORY TYPES
// ============================================================================

/**
 * TMaterialStockInventory - Entity type untuk inventory view (camelCase)
 */
export type TMaterialStockInventory = {
  id: number;
  date: string;
  name: string;
  firstStockCount: number;
  stockInCount: number;
  stockOutCount: number;
  currentStock: number;
  unitQuantity: string;
  updatedAt: Date;
  outTimes: string;
  inTimes: string;
}

/**
 * TMaterialInventoryGetResponse - API response type (snake_case)
 */
export type TMaterialInventoryGetResponse = {
  id: number;
  date: string;
  name: string;
  first_stock_count: number;
  stock_in_count: number;
  stock_out_count: number;
  current_stock: number;
  unit_quantity: string;
  updated_at: Date;
  out_times: string;
  in_times: string;
}

// ============================================================================
// RAW DATA TYPES (untuk mappers - dari database layer)
// ============================================================================

/**
 * @deprecated Use TMaterialStockInventory instead
 */
export type MaterialInventoryRawData = TMaterialStockInventory;

// Helper type untuk suplier info (menghindari circular dependency)
type SuplierBasicInfo = {
  id: number;
  name: string;
}

export type MaterialStockInRawData = {
  id: number;
  material_id: number;
  price: number;
  quantity_unit: string;
  quantity: number;
  received_at: Date;
  createdAt: Date;
  updatedAt: Date;
  material: Pick<TMaterial, 'name'> & {
    suplier_id: number;
    suplier: SuplierBasicInfo;
  };
}

// ============================================================================
// ENTITY TYPES (camelCase - hasil mapping dari database)
// ============================================================================

/**
 * MaterialEntity - Entity version dari TMaterial (required fields only)
 * Digunakan di repository/mapper layer
 */
export type MaterialEntity = Required<TMaterialWithID>;

// Helper types untuk nested relations
export type MaterialInfo = Pick<MaterialEntity, 'name' | 'suplierId'>;

// ============================================================================
// STOCK ENTITY TYPES
// ============================================================================

export interface MaterialStockInEntity {
  id: number;
  materialId: number;
  price: number;
  quantityUnit: string;
  quantity: number;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  material: MaterialInfo & {
    suplier?: SuplierBasicInfo;
  };
}

export interface MaterialStockOutEntity {
  id: number;
  materialId: number;
  quantity: number;
  quantityUnit: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simplified versions (tanpa nested relations)
export type MaterialStockInSimpleEntity = Omit<MaterialStockInEntity, 'material'>;
export type MaterialStockOutSimpleEntity = MaterialStockOutEntity;

// Material dengan relasi stocks (aggregated)
export interface MaterialWithStocksEntity extends MaterialEntity {
  materialIn: MaterialStockInSimpleEntity[];
  materialOut: MaterialStockOutSimpleEntity[];
}

// ============================================================================
// REPOSITORY INPUT/OUTPUT TYPES
// ============================================================================

export type CreateMaterialInput = Pick<MaterialEntity, 'name' | 'suplierId' | 'isActive'>;

export type CreateStockInInput = Pick<MaterialStockInEntity, 'materialId' | 'price' | 'quantityUnit' | 'quantity'>;

export type CreateStockOutInput = Pick<MaterialStockOutEntity, 'materialId' | 'quantity' | 'quantityUnit'>;

// Generic paginated result (reusable untuk resource lain)
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export type PaginatedMaterialStockIn = PaginatedResult<MaterialStockInEntity>;
