import z from "zod";

export const getRolesSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, { message: 'Page must be a number' })
      .transform(Number)
      .refine(val => val > 0, { message: 'Page must be greater than 0' })
      .optional(),
    
    limit: z.string()
      .regex(/^\d+$/, { message: 'Limit must be a number' })
      .transform(Number)
      .refine(val => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' })
      .optional(),
    
    search_key: z.string()
      .optional(),
    
    search_value: z.string()
      .optional(),
    
    is_active: z.string()
      .regex(/^(true|false)$/, { message: 'is_active must be true or false' })
      .transform(val => val === 'true')
      .optional()
  })
});
export const createRoleSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name must be at most 50 characters long' }),
    
    description: z.string()
      .max(255, { message: 'Description must be at most 255 characters long' })
      .optional(),
    
    is_active: z.boolean()
  })
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name must be at most 50 characters long' })
      .optional(),
    
    description: z.string()
      .max(255, { message: 'Description must be at most 255 characters long' })
      .optional(),
    
    is_active: z.boolean()
      .optional()
  })
});

export const deleteRoleSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, { message: 'ID must be a number' })
  })
});