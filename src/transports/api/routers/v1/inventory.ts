import express from 'express';
import { InventoryController } from '../../controllers/InventoryController';
import { validate } from '../../validations/validate.middleware';
import { inventoryStockInSchema, inventoryStockInUpdateSchema } from '../../validations/inventory.validation';
import { getPaginationSchema } from '../../validations/pagination.validation';
import InventoryService from '../../../../core/services/InventoryService';
import MaterialRepository from '../../../../adapters/postgres/repositories/MaterialRepository';
import { ProductRepository } from '../../../../adapters/postgres/repositories/ProductRepository';
import SupplierRepository from '../../../../adapters/postgres/repositories/SupplierRepository';

const router = express.Router();

// Initialize repositories
const materialRepository = new MaterialRepository();
const productRepository = new ProductRepository();
const supplierRepository = new SupplierRepository();

// Initialize service
const inventoryService = new InventoryService(
	materialRepository,
	productRepository,
	supplierRepository
);

// Initialize controller
const inventoryController = new InventoryController();

/**
 * POST /api/v1/inventory/in
 * Unified batch stock in endpoint for both Material and Product
 * 
 * Request body (Single Material):
 * {
 *   "items": [
 *     {
 *       "item_type": "MATERIAL",
 *       "quantity": 100,
 *       "unit_quantity": "kg",
 *       "price": 50000,
 *       "supplier_id": 1,
 *       "material_id": 5,  // Optional if creating new material
 *       "material": {      // Optional if using existing material_id
 *         "name": "Flour",
 *         "is_active": true
 *       }
 *     }
 *   ]
 * }
 * 
 * Request body (Single Product):
 * {
 *   "items": [
 *     {
 *       "item_type": "PRODUCT",
 *       "quantity": 50,
 *       "unit_quantity": "pcs",
 *       "price": 15000,
 *       "supplier_id": 2,
 *       "product_id": 3
 *     }
 *   ]
 * }
 * 
 * Request body (Batch - Multiple Items):
 * {
 *   "items": [
 *     {
 *       "item_type": "MATERIAL",
 *       "quantity": 100,
 *       "unit_quantity": "kg",
 *       "price": 50000,
 *       "supplier_id": 1,
 *       "material_id": 5
 *     },
 *     {
 *       "item_type": "PRODUCT",
 *       "quantity": 30,
 *       "unit_quantity": "pcs",
 *       "price": 15000,
 *       "supplier_id": 2,
 *       "product_id": 7
 *     }
 *   ]
 * }
 * 
 * Notes:
 * - Maximum 100 items per request
 * - Partial success supported (207 Multi-Status if some items fail)
 * - All items processed independently
 */
router.post(
	"/in",
	validate(inventoryStockInSchema),
	inventoryController.stockIn(inventoryService)
);

/**
 * PUT /api/v1/inventory/in/:item_type/:id
 * Update stock in record for Material or Product
 * 
 * Path parameters:
 * - item_type: "MATERIAL" | "PRODUCT"
 * - id: number (record ID)
 * 
 * Request body (same as POST /inventory/in, single item):
 * Material example:
 * {
 *   "item_type": "MATERIAL",
 *   "quantity": 150,
 *   "unit_quantity": "kg",
 *   "price": 75000,
 *   "supplier_id": 1,
 *   "material_id": 5
 * }
 * 
 * Product example:
 * {
 *   "item_type": "PRODUCT",
 *   "quantity": 40,
 *   "unit_quantity": "pcs",
 *   "price": 20000,
 *   "supplier_id": 2,
 *   "product_id": 3
 * }
 * 
 * Response example (same format as POST):
 * {
 *   "status": "success",
 *   "message": "Stock in record updated successfully",
 *   "data": {
 *     "id": 1,
 *     "item_type": "PRODUCT",
 *     "item_name": "Product Name",
 *     "quantity": 50,
 *     "unit_quantity": "liter",
 *     "price": 75000,
 *     "supplier": {
 *       "id": 2,
 *       "name": "PT.ABC"
 *     },
 *     "current_stock": 50,
 *     "created_at": "2025-10-30T18:32:34.884Z"
 *   }
 * }
 * 
 * Notes:
 * - If item_type changes (MATERIAL -> PRODUCT or vice versa):
 *   - Old record is deleted
 *   - New record is created with new ID
 * - If item_type stays the same:
 *   - Record is updated in place
 * - Response format is same as POST /inventory/in
 */
router.put(
	"/in/:item_type/:id",
	validate(inventoryStockInUpdateSchema),
	inventoryController.updateStockIn(inventoryService)
);

/**
 * GET /api/v1/inventory/buy
 * Unified buy list endpoint for both Material purchases and Product PURCHASE
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * 
 * Response example:
 * {
 *   "status": "success",
 *   "message": "Buy list retrieved successfully",
 *   "data": {
 *     "data": [
 *       {
 *         "id": 1,
 *         "item_type": "MATERIAL",
 *         "item_id": 5,
 *         "item_name": "Flour",
 *         "quantity": 100,
 *         "unit_quantity": "kg",
 *         "price": 50000,
 *         "total_price": 5000000,
 *         "supplier": {
 *           "id": 1,
 *           "name": "Supplier A"
 *         },
 *         "purchased_at": "2024-01-15T10:30:00.000Z"
 *       },
 *       {
 *         "id": 2,
 *         "item_type": "PRODUCT",
 *         "item_id": 7,
 *         "item_name": "Product X",
 *         "quantity": 30,
 *         "unit_quantity": "pcs",
 *         "price": 15000,
 *         "total_price": 450000,
 *         "supplier": {
 *           "id": 2,
 *           "name": "Supplier B"
 *         },
 *         "purchased_at": "2024-01-14T09:15:00.000Z"
 *       }
 *     ],
 *     "total": 2
 *   }
 * }
 */
router.get(
	"/buy",
	validate(getPaginationSchema),
	inventoryController.getBuyList(inventoryService)
);

export default router;
