
import {  TCategoryGetResponse } from "./category";

export type TProduct = {
  name: string;
  imagePath?: string | null;
  description?: string | null;
  price: number;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    isActive: boolean;
  };
  isActive: boolean;
}
export type TProductWithID = TProduct & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};
export type TProductCreate = Omit<TProduct, 'isActive' | 'category' > & {
  isActive?: boolean;
  categoryId: number;
};

export type TProductCreateRequest = Omit<TProductCreate, "isActive" | "imagePath" | "description"> & {
  is_active?: boolean;
  image_path?: string;
  description?: string;
};
export type TProductUpdateRequest = Omit<TProductCreateRequest, "name" | "price" | "categoryId"> & {
  name?: string;
  price?: number;
  category_id?: number;
};
export type TProductGetResponse = {
  id: number;
  name: string;
  image_path?: string | null;
  description?: string | null;
  price: number;
  category: Omit<TCategoryGetResponse, 'created_at' | 'updated_at'>  | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PRODUCT STOCK INVENTORY TYPES - ENTITY LAYER (camelCase)
// ============================================================================

/**
 * Product stock in request (PRODUCTION source)
 */
export type TProductStockInRequest = {
  product_id: number;
  quantity: number;
  unit_quantity: string;
}

/**
 * Product Stock In Entity - Domain entity for stock in records
 */
export type TProductStockIn = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitQuantity: string;
  currentStock: number;
  date: Date;
}

/**
 * Product Stock Inventory Entity - Domain entity for inventory view
 */
export type TProductStockInventory = {
  id: number;
  date: string;
  name: string;
  firstStockCount: number;
  stockInCount: number;
  stockOutCount: number;
  currentStock: number;
  unitQuantity: string;
  updatedAt: Date;
  inTimes: string;
  outTimes: string;
}

// ============================================================================
// RESPONSE TYPES (snake_case for API)
// ============================================================================

/**
 * Product stock in response
 */
export type TProductStockInResponse = {
  id: number;
  item_type: "PRODUCT";
  item_name: string;
  quantity: number;
  unit_quantity: string;
  current_stock: number;
  created_at: string;
}

/**
 * Product stock inventory response (API layer - snake_case)
 * Same format as Material stocks inventory
 */
export type TProductInventoryGetResponse = {
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

/**
 * @deprecated Use TProductStockInventory instead
 * Product stock inventory raw data (internal - camelCase)
 */
export type ProductInventoryRawData = TProductStockInventory;

