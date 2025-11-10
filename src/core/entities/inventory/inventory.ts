// Inventory Entity Types
// Material stock management only

/**
 * Item type enum for inventory system
 * Keep for backward compatibility
 */
export enum ItemType {
	MATERIAL = "MATERIAL",
	PRODUCT = "PRODUCT"
}

/**
 * Product source enum (from Prisma schema)
 * Keep for other endpoints
 */
export enum ProductSource {
	PURCHASE = "PURCHASE",
	PRODUCTION = "PRODUCTION"
}

/**
 * Single inventory stock in item (API layer - snake_case)
 * Material only
 */
export type TInventoryStockInItem = {
	quantity: number;
	unit_quantity: string;
	price: number;
	supplier_id: number;
	material_id?: number;
	material?: {
		name: string;
		is_active?: boolean;
	};
};

/**
 * Batch inventory stock in request (supports single or multiple material items)
 */
export type TInventoryStockInRequest = {
	items: TInventoryStockInItem[];
};

/**
 * Update inventory stock in request (PUT endpoint)
 * Same structure as TInventoryStockInItem
 */
export type TInventoryStockInUpdateRequest = TInventoryStockInItem;

// ============================================================================
// ENTITY TYPES (camelCase - for Service layer)
// ============================================================================

/**
 * Inventory Stock In Item Entity - Domain entity (camelCase)
 * What service returns for single stock in operation
 * Material only
 */
export type TInventoryStockInEntity = {
	id: number;
	itemType: "MATERIAL";
	itemName: string;
	quantity: number;
	unitQuantity: string;
	price: number;
	supplier: {
		id: number;
		name: string;
	};
	currentStock: number;
	createdAt: Date;
};

/**
 * Batch Inventory Stock In Entity - Domain entity (camelCase)
 * What service returns for batch operations
 */
export type TInventoryStockInBatchEntity = {
	successCount: number;
	failedCount: number;
	totalCount: number;
	items: TInventoryStockInEntity[];
	errors?: Array<{
		index: number;
		item: TInventoryStockInItem;
		error: string;
	}>;
};

/**
 * Inventory Buy List Item Entity - Domain entity (camelCase)
 * Material only
 */
export type TInventoryBuyListItemEntity = {
	id: number;
	itemType: "MATERIAL";
	itemId: number;
	itemName: string;
	quantity: number;
	unitQuantity: string;
	price: number;
	supplier: {
		id: number;
		name: string;
	};
	purchasedAt: Date;
};

// ============================================================================
// RESPONSE TYPES (snake_case - for API/Controller layer)
// ============================================================================

/**
 * Single inventory stock in response (API layer - snake_case)
 * Used for both POST and PUT endpoints
 * Material only
 */
export type TInventoryStockInItemResponse = {
	id: number;
	item_type: "MATERIAL";
	item_name: string;
	quantity: number;
	unit_quantity: string;
	price: number; // Total price (not per unit)
	supplier: {
		id: number;
		name: string;
	};
	current_stock: number;
	created_at: string;
};

/**
 * Batch inventory stock in response
 */
export type TInventoryStockInResponse = {
	success_count: number;
	failed_count: number;
	total_count: number;
	items: TInventoryStockInItemResponse[];
	errors?: Array<{
		index: number;
		item: TInventoryStockInItem;
		error: string;
	}>;
};

// ============================================================================
// INTERNAL ENTITY TYPES (for repository operations)
// ============================================================================

/**
 * Material stock in entity (internal - camelCase)
 */
export type MaterialStockInEntity = {
	materialId: number;
	quantity: number;
	price: number;
	quantityUnit: string;
};

/**
 * Product stock in entity (internal - camelCase)
 * Keep for other endpoints
 */
export type ProductStockInEntity = {
	productId: number;
	quantity: number;
	price: number;
	supplierId: number;
	sourceFrom: "PURCHASE";
};

/**
 * Inventory item basic info
 */
export type InventoryItemInfo = {
	id: number;
	name: string;
	currentStock: number;
};

/**
 * Product with stock relation (from DB)
 */
export type ProductWithStocks = {
	id: number;
	name: string;
	price: number;
	categoryId: number;
	isActive: boolean;
	stocks: Array<{
		id: number;
		quantity: number;
		date: Date;
		sourceFrom: "PURCHASE" | "PRODUCTION";
		detail?: {
			price: number;
			supplierId: number;
		} | null;
	}>;
};

/**
 * Material with stock relation (from DB)
 */
export type MaterialWithStocks = {
	id: number;
	name: string;
	materialIn: Array<{
		quantity: number;
		createdAt: Date;
	}>;
	materialOut: Array<{
		quantity: number;
		createdAt: Date;
	}>;
};

// ============================================================================
// BUY LIST TYPES (for GET /inventory/buy endpoint)
// ============================================================================

/**
 * Single inventory buy list item (API layer - snake_case)
 * Material purchase only
 */
export type TInventoryBuyListItem = {
	id: number;
	item_type: "MATERIAL";
	item_id: number;
	item_name: string;
	quantity: number;
	unit_quantity: string;
	price: number; // Total price (not per unit)
	supplier: {
		id: number;
		name: string;
	};
	purchased_at: string; // ISO date string
};

/**
 * Inventory buy list response (for service layer)
 * Returns data array and total count for pagination
 */
export type TInventoryBuyListResponse = {
	data: TInventoryBuyListItem[];
	total: number;
};
