import z from "zod";

export const getPaginationSchema = z.object({
  query: z.object({
    page: z.preprocess(
      (val) => val ?? '1',
      z.string()
        .regex(/^\d+$/, { message: 'Page must be a number' })
        .transform(Number)
        .refine(val => val > 0, { message: 'Page must be greater than 0' })
    ),
    
    limit: z.preprocess(
      (val) => val ?? '10',
      z.string()
        .regex(/^\d+$/, { message: 'Limit must be a number' })
        .transform(Number)
        .refine(val => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' })
    ),
    
    search_key: z.string()
      .optional(),
    
    search_value: z.string()
      .optional(),
    
    is_active: z.string()
      .regex(/^(true|false)$/, { message: 'is_active must be true or false' })
      .transform(val => val === 'true')
      .optional(),
    
    category_id: z.string()
      .regex(/^\d+$/, { message: 'category_id must be a number' })
      .transform(Number)
      .optional(),
    
    outlet_id: z.string()
      .regex(/^\d+$/, { message: 'outlet_id must be a number' })
      .transform(Number)
      .optional()
  })
});