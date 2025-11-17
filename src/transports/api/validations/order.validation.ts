import z from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    payment_method: z.string().min(1, 'Payment method is required'),
    is_using_bag: z.enum(['small', 'medium', 'large']).optional(),
    packaging_type: z.enum(['cup', 'box', 'none']).optional(),
    items: z.array(
      z.object({
        product_id: z.number().int().positive('Product ID must be a positive integer'),
        qty: z.number().int().positive('Quantity must be a positive integer'),
      })
    ).min(1, 'At least one item is required'),
  }),
});
