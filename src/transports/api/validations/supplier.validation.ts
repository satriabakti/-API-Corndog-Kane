import z from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z.string().min(1, 'Phone is required'),
    is_active: z.boolean().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    address: z.string().min(1, 'Address is required').optional(),
    phone: z.string().min(1, 'Phone is required').optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid supplier ID'),
  }),
});

export const deleteSupplierSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid supplier ID'),
  }),
});