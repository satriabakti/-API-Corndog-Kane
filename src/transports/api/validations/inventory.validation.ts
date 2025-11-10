import z from 'zod';

/**
 * Single inventory stock in item schema (Material only)
 */
const inventoryStockInItemSchema = z.object({
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
	{ message: 'Either material_id or material must be provided' }
);

/**
 * Validation schema for batch inventory stock in endpoint
 * Supports multiple material items
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
 * Single material item update
 */
export const inventoryStockInUpdateSchema = z.object({
	params: z.object({
		id: z.string().regex(/^\d+$/, "id must be a valid number"),
	}),
	body: inventoryStockInItemSchema,
});
