import { z } from 'zod';
import PostgresAdapter from '../../../adapters/postgres/instance';

/**
 * Helper function to get product current stock from latest inventory date
 */
async function getProductCurrentStock(productId: number): Promise<number> {
  const productWithStocks = await PostgresAdapter.client.productStock.findMany({
    where: { product_id: productId },
    orderBy: { date: 'desc' },
    take: 1,
  });
  
  if (productWithStocks.length === 0) return 0;
  
  // Sum all stocks for this product
  const allStocks = await PostgresAdapter.client.productStock.findMany({
    where: { product_id: productId },
  });
  
  return allStocks.reduce((sum, stock) => sum + stock.quantity, 0);
}

/**
 * Helper function to get material current stock from latest inventory date
 */
async function getMaterialCurrentStock(materialId: number): Promise<number> {
  const [materialIns, materialOuts] = await Promise.all([
    PostgresAdapter.client.materialIn.findMany({
      where: { material_id: materialId },
    }),
    PostgresAdapter.client.materialOut.findMany({
      where: { material_id: materialId },
    }),
  ]);
  
  const totalIn = materialIns.reduce((sum, item) => sum + item.quantity, 0);
  const totalOut = materialOuts.reduce((sum, item) => sum + item.quantity, 0);
  
  return totalIn - totalOut;
}

/**
 * Validation schema for creating product request items in batch
 */
const createProductRequestItemSchema = z.object({
  id: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
}).superRefine(async (data, ctx) => {
  const currentStock = await getProductCurrentStock(data.id);
  if (data.quantity > currentStock) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Requested quantity (${data.quantity}) exceeds available stock (${currentStock}) for product ID ${data.id}`,
      path: ['quantity'],
    });
  }
});

/**
 * Validation schema for creating material request items in batch
 */
const createMaterialRequestItemSchema = z.object({
  id: z.number().int().positive('Material ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
}).superRefine(async (data, ctx) => {
  const currentStock = await getMaterialCurrentStock(data.id);
  if (data.quantity > currentStock) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Requested quantity (${data.quantity}) exceeds available stock (${currentStock}) for material ID ${data.id}`,
      path: ['quantity'],
    });
  }
});

/**
 * Body schema for creating outlet request
 */
const createOutletRequestBodySchema = z.object({
  products: z.array(createProductRequestItemSchema).optional(),
  materials: z.array(createMaterialRequestItemSchema).optional(),
}).refine(
  (data) => {
    const hasProducts = data.products && data.products.length > 0;
    const hasMaterials = data.materials && data.materials.length > 0;
    return hasProducts || hasMaterials;
  },
  {
    message: 'At least one product or material must be requested',
    path: ['products'],
  }
);

/**
 * Validation schema for creating a new outlet request (batch)
 * Can contain both products and materials
 */
export const createOutletRequestSchema = z.object({
  body: createOutletRequestBodySchema,
});

/**
 * Body schema for updating product request
 */
const updateProductRequestBodySchema = z.object({
  product_id: z.number().int().positive('Product ID must be a positive integer').optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer').optional(),
}).refine(
  (data) => data.product_id !== undefined || data.quantity !== undefined,
  {
    message: 'At least one field (product_id or quantity) must be provided',
  }
).superRefine(async (data, ctx) => {
  if (data.product_id && data.quantity) {
    const currentStock = await getProductCurrentStock(data.product_id);
    if (data.quantity > currentStock) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Requested quantity (${data.quantity}) exceeds available stock (${currentStock}) for product ID ${data.product_id}`,
        path: ['quantity'],
      });
    }
  }
});

/**
 * Validation schema for updating a product request
 * Only product_id and quantity can be updated
 */
export const updateProductRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Request ID is required'),
  }),
  body: updateProductRequestBodySchema,
});

/**
 * Body schema for updating material request
 */
const updateMaterialRequestBodySchema = z.object({
  material_id: z.number().int().positive('Material ID must be a positive integer').optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer').optional(),
}).refine(
  (data) => data.material_id !== undefined || data.quantity !== undefined,
  {
    message: 'At least one field (material_id or quantity) must be provided',
  }
).superRefine(async (data, ctx) => {
  if (data.material_id && data.quantity) {
    const currentStock = await getMaterialCurrentStock(data.material_id);
    if (data.quantity > currentStock) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Requested quantity (${data.quantity}) exceeds available stock (${currentStock}) for material ID ${data.material_id}`,
        path: ['quantity'],
      });
    }
  }
});

/**
 * Validation schema for updating a material request
 * Only material_id and quantity can be updated
 */
export const updateMaterialRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Request ID is required'),
  }),
  body: updateMaterialRequestBodySchema,
});

/**
 * Validation schema for approval quantity items
 */
const approvalQuantityItemSchema = z.object({
  request_id: z.number().int().positive('Request ID must be a positive integer'),
  approval_quantity: z.number().int().positive('Approval quantity must be a positive integer'),
});

/**
 * Validation schema for new product items to add during approval
 */
const newProductRequestItemSchema = z.object({
  id: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
}).superRefine(async (data, ctx) => {
  const currentStock = await getProductCurrentStock(data.id);
  if (data.quantity > currentStock) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Requested quantity (${data.quantity}) exceeds available stock (${currentStock}) for product ID ${data.id}`,
      path: ['quantity'],
    });
  }
});

/**
 * Validation schema for new material items to add during approval
 */
const newMaterialRequestItemSchema = z.object({
  id: z.number().int().positive('Material ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
}).superRefine(async (data, ctx) => {
  const currentStock = await getMaterialCurrentStock(data.id);
  if (data.quantity > currentStock) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Requested quantity (${data.quantity}) exceeds available stock (${currentStock}) for material ID ${data.id}`,
      path: ['quantity'],
    });
  }
});

/**
 * Body schema for approving requests
 * Can approve existing requests and add new ones
 * Requires outlet_id to be specified in the request body
 */
const approveRequestsBodySchema = z.object({
  outlet_id: z.number().int().positive('Outlet ID must be a positive integer'),
  product_requests: z.array(approvalQuantityItemSchema).optional(),
  material_requests: z.array(approvalQuantityItemSchema).optional(),
  new_products: z.array(newProductRequestItemSchema).optional(),
  new_materials: z.array(newMaterialRequestItemSchema).optional(),
}).refine(
  (data) => {
    const hasProducts = data.product_requests && data.product_requests.length > 0;
    const hasMaterials = data.material_requests && data.material_requests.length > 0;
    const hasNewProducts = data.new_products && data.new_products.length > 0;
    const hasNewMaterials = data.new_materials && data.new_materials.length > 0;
    return hasProducts || hasMaterials || hasNewProducts || hasNewMaterials;
  },
  {
    message: 'At least one product, material, new product, or new material must be provided',
    path: ['product_requests'],
  }
);

/**
 * Validation schema for approving requests
 * Must include approval_quantity for all items
 */
export const approveRequestsSchema = z.object({
  body: approveRequestsBodySchema,
});

/**
 * Type exports for use in controllers
 */
export type TCreateOutletRequestBody = z.infer<typeof createOutletRequestBodySchema>;
export type TUpdateProductRequestBody = z.infer<typeof updateProductRequestBodySchema>;
export type TUpdateMaterialRequestBody = z.infer<typeof updateMaterialRequestBodySchema>;
export type TApproveRequestsBody = z.infer<typeof approveRequestsBodySchema>;
