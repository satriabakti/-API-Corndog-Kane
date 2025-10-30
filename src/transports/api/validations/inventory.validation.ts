import z from 'zod';

/**
 * Single inventory stock in item schema
 */
const inventoryStockInItemSchema = z.discriminatedUnion("item_type", [
	// Material stock in schema
	z.object({
		item_type: z.literal("MATERIAL"),
		quantity: z.number().positive('quantity must be positive'),
		unit_quantity: z.string().min(1, 'unit_quantity is required'),
		price: z.number().positive('price must be positive'),
		supplier_id: z.number().int().positive('supplier_id is required'),
		material_id: z.number().int().positive().optional(),
		material: z.object({
			name: z.string().min(1, 'material name is required'),
			is_active: z.boolean().optional(),
		}).optional(),
	}).refine(
		(data) => data.material_id || data.material,
		{ message: 'Either material_id or material must be provided for MATERIAL type' }
	),
	
	// Product stock in schema
	z.object({
		item_type: z.literal("PRODUCT"),
		quantity: z.number().positive('quantity must be positive'),
		unit_quantity: z.string().min(1, 'unit_quantity is required'),
		price: z.number().positive('price must be positive'),
		supplier_id: z.number().int().positive('supplier_id is required'),
		product_id: z.number().int().positive('product_id is required for PRODUCT type'),
	}),
]);

/**
 * Validation schema for batch inventory stock in endpoint
 * Supports multiple items (Material and/or Product)
 */
export const inventoryStockInSchema = z.object({
	body: z.object({
		items: z.array(inventoryStockInItemSchema)
			.min(1, 'At least one item is required')
			.max(100, 'Maximum 100 items per request'),
	}),
});

/**
 * Validation schema for update inventory stock in endpoint
 * Single item update (Material or Product)
 */
export const inventoryStockInUpdateSchema = z.object({
	params: z.object({
		item_type: z.enum(["MATERIAL", "PRODUCT"], {
			message: "item_type must be MATERIAL or PRODUCT",
		}),
		id: z.string().regex(/^\d+$/, "id must be a valid number"),
	}),
	body: inventoryStockInItemSchema,
});
