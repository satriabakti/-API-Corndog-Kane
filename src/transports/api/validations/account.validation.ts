import z from 'zod';

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'name is required'),
    number: z.string().min(1, 'number is required'),
    account_category_id: z.number().int().positive('account_category_id is required'),
    account_type_id: z.number().int().positive('account_type_id is required'),
    description: z.string().optional(),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    number: z.string().min(1).optional(),
    account_category_id: z.number().int().positive().optional(),
    account_type_id: z.number().int().positive().optional(),
    description: z.string().optional(),
  }),
});

export const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
});

export const getAccountByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
});
