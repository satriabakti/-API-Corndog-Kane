import z from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    account_id: z.number().int().positive('account_id is required'),
    amount: z.number().positive('amount must be positive'),
    transaction_type: z.enum(['INCOME', 'EXPENSE']),
    description: z.string().optional(),
    transaction_date: z.string().regex(
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
      'transaction_date must be a valid ISO date string'
    ),
    reference_number: z.string().optional(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
  body: z.object({
    account_id: z.number().int().positive().optional(),
    amount: z.number().positive().optional(),
    transaction_type: z.enum(['INCOME', 'EXPENSE']).optional(),
    description: z.string().optional(),
    transaction_date: z.string().regex(
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/
    ).optional(),
    reference_number: z.string().optional(),
  }),
});

export const deleteTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
});

export const getTransactionByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
});

export const generateReportSchema = z.object({
  query: z.object({
    type: z.enum(['table', 'pdf', 'xlsx']).optional().default('table'),
    start_date: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'start_date must be in YYYY-MM-DD format'
    ),
    end_date: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'end_date must be in YYYY-MM-DD format'
    ),
    account_category_ids: z.string().regex(
      /^\d+(,\d+)*$/,
      'account_category_ids must be comma-separated numbers'
    ).optional(),
  }),
});
