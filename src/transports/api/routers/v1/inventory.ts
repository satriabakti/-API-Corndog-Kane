import express from 'express';
import { InventoryController } from '../../controllers/InventoryController';
import { validate } from '../../validations/validate.middleware';
import { inventoryStockInSchema, inventoryStockInUpdateSchema } from '../../validations/inventory.validation';
import { getPaginationSchema } from '../../validations/pagination.validation';
import InventoryService from '../../../../core/services/InventoryService';
import MaterialRepository from '../../../../adapters/postgres/repositories/MaterialRepository';
import SupplierRepository from '../../../../adapters/postgres/repositories/SupplierRepository';

const router = express.Router();

// Initialize repositories
const materialRepository = new MaterialRepository();
const supplierRepository = new SupplierRepository();

// Initialize service
const inventoryService = new InventoryService(
	materialRepository,
	supplierRepository
);

// Initialize controller
const inventoryController = new InventoryController();

/**
 * POST /api/v1/inventory/in
 * Material stock in endpoint (batch supported)
 * 
 * Request body (Single Material with existing material_id):
 * {
 *   "items": [
 *     {
 *       "quantity": 100,
 *       "unit_quantity": "kg",
 *       "price": 50000,
 *       "supplier_id": 1,
 *       "material_id": 5
 *     }
 *   ]
 * }
 * 
 * Request body (Single Material - create new):
 * {
 *   "items": [
 *     {
 *       "quantity": 50,
 *       "unit_quantity": "liter",
 *       "price": 75000,
 *       "supplier_id": 2,
 *       "material": {
 *         "name": "Minyak Goreng",
 *         "is_active": true
 *       }
 *     }
 *   ]
 * }
 * 
 * Request body (Batch - Multiple Materials):
 * {
 *   "items": [
 *     {
 *       "quantity": 100,
 *       "unit_quantity": "kg",
 *       "price": 50000,
 *       "supplier_id": 1,
 *       "material_id": 5
 *     },
 *     {
 *       "quantity": 50,
 *       "unit_quantity": "liter",
 *       "price": 75000,
 *       "supplier_id": 2,
 *       "material": {
 *         "name": "Minyak Goreng",
 *         "is_active": true
 *       }
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
 * PUT /api/v1/inventory/in/:id
 * Update material stock in record
 * 
 * Path parameters:
 * - id: number (material_in record ID)
 * 
 * Request body:
 * {
 *   "quantity": 150,
 *   "unit_quantity": "kg",
 *   "price": 75000,
 *   "supplier_id": 1,
 *   "material_id": 5
 * }
 * 
 * Or with new material:
 * {
 *   "quantity": 40,
 *   "unit_quantity": "liter",
 *   "price": 20000,
 *   "supplier_id": 2,
 *   "material": {
 *     "name": "Minyak Baru",
 *     "is_active": true
 *   }
 * }
 * 
 * Response example:
 * {
 *   "status": "success",
 *   "message": "Stock in record updated successfully",
 *   "data": {
 *     "id": 1,
 *     "item_type": "MATERIAL",
 *     "item_name": "Flour",
 *     "quantity": 150,
 *     "unit_quantity": "kg",
 *     "price": 75000,
 *     "supplier": {
 *       "id": 1,
 *       "name": "PT.ABC"
 *     },
 *     "current_stock": 500,
 *     "created_at": "2025-10-30T18:32:34.884Z"
 *   }
 * }
 */
router.put(
	"/in/:id",
	validate(inventoryStockInUpdateSchema),
	inventoryController.updateStockIn(inventoryService)
);

/**
 * GET /api/v1/inventory/buy
 * Material purchases list endpoint
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
 *         "supplier": {
 *           "id": 1,
 *           "name": "Supplier A"
 *         },
 *         "purchased_at": "2024-01-15T10:30:00.000Z"
 *       }
 *     ],
 *     "total": 1
 *   }
 * }
 */
router.get(
	"/buy",
	validate(getPaginationSchema),
	inventoryController.getBuyList(inventoryService)
);

export default router;
