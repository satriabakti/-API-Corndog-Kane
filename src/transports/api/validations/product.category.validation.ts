import z from 'zod';

export const createProductCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    is_active: z.boolean().optional(),
  }),
});

export const updateProductCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required' }).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'Invalid category ID' }),
  }),
});

export const deleteProductCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid category ID' }),
  }),
});
