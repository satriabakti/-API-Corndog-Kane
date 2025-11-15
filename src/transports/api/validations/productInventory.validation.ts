import z from 'zod';

export const productInventoryCreateSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive('Product ID must be a positive integer'),
    quantity: z.number().int().nonnegative('Quantity must be a non-negative integer'),
    material_id: z.number().int().positive('Material ID must be a positive integer'),
  }),
});

export const productInventoryUpdateSchema = z.object({
  body: z.object({
    quantity: z.number().int().nonnegative('Quantity must be a non-negative integer').optional(),
    material_id: z.number().int().positive('Material ID must be a positive integer').optional(),
  }),
});