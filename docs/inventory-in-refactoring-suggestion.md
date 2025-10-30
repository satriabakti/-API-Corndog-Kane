# Refactoring Suggestion: `/materials/in` → `/inventory/in`

## 🎯 Objective

Mengubah endpoint `/materials/in` menjadi **unified endpoint** `/inventory/in` yang dapat handle:
- ✅ **Material stock in** (raw materials dari supplier)
- ✅ **Product stock in** (finished goods dari supplier/purchase)

---

## 📊 ANALISIS PROSES BISNIS

### Current State (Sekarang)
```
/materials/in  → Hanya untuk material (bahan baku)
                 Input: material_id, quantity, price, supplier_id
                 
(Belum ada endpoint untuk product stock in dari pembelian)
```

### Future State (Yang Diusulkan)
```
/inventory/in  → Unified untuk semua item inventory
                 Input: item_type (MATERIAL/PRODUCT), item_id, quantity, price, supplier_id
                 
Benefits:
✅ Satu endpoint untuk semua stock in
✅ Consistent business process
✅ Easier untuk reporting & tracking
✅ Scalable untuk inventory type baru
```

---

## 🔄 PERUBAHAN PROSES BISNIS

### Scenario 1: Material Stock In (Bahan Baku)
**Contoh**: Restoran beli 50 kg Tepung dari Supplier A

```
BEFORE (/materials/in):
1. Staff pilih material dari list
2. Input quantity, unit, price
3. Pilih supplier
4. Submit → Material stock bertambah

AFTER (/inventory/in):
1. Staff pilih inventory type: "MATERIAL" 
2. Staff pilih material dari list
3. Input quantity, unit, price
4. Pilih supplier
5. Submit → Material stock bertambah
```

### Scenario 2: Product Stock In (Barang Jadi dari Pembelian)
**Contoh**: Restoran beli 100 botol Coca-Cola dari Distributor

```
NEW FEATURE (/inventory/in):
1. Staff pilih inventory type: "PRODUCT"
2. Staff pilih product dari list
3. Input quantity, unit, price
4. Pilih supplier
5. Submit → Product stock bertambah
   
Note: Product dari purchase berbeda dengan product dari production
      (Ada field `source_from: PURCHASE` di ProductStock table)
```

### Business Logic Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Endpoint** | `/materials/in` | `/inventory/in` |
| **Item Types** | Material only | Material + Product |
| **Source Tracking** | - | `PURCHASE` for products |
| **Stock Table** | `material_ins` | `material_ins` + `product_stocks` |
| **Validation** | Material exists | Item exists based on type |
| **Supplier** | Required | Required |
| **Unit Tracking** | Material unit | Material/Product unit |

---

## 🏗️ PERUBAHAN TEKNIS

### 1. DATABASE SCHEMA (Sudah Support!)

Berdasarkan schema Prisma yang ada, struktur database **sudah siap**:

```prisma
// Material Stock In (existing)
model MaterialIn {
  id            Int      @id @default(autoincrement())
  material_id   Int
  price         Int
  quantity_unit String
  quantity      Int
  material      material @relation(fields: [material_id], references: [id])
  received_at   DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@map("material_ins")
}

// Product Stock (existing - PERFECT!)
model ProductStock {
  id          Int            @id @default(autoincrement())
  product_id  Int
  products    Product        @relation(fields: [product_id], references: [id])
  quantity    Int            @default(0)
  date        DateTime
  source_from PRODUCTSOURCE  @default(PRODUCTION)  // ← KEY FIELD!
  detail      ProductStockDetail?
  @@map("product_stocs")
}

// Product Stock Detail (untuk PURCHASE source)
model ProductStockDetail {
  id          Int          @id @default(autoincrement())
  stock_id    Int          @unique
  price       Float
  supplier_id Int
  supplier    Supplier     @relation(fields: [supplier_id], references: [id])
  stock       ProductStock @relation(fields: [stock_id], references: [id])
  @@map("product_stock_detail")
}

enum PRODUCTSOURCE {
  PRODUCTION  // ← Product dari produksi internal
  PURCHASE    // ← Product dari pembelian supplier
}
```

**✅ Database sudah siap!** Tinggal buat logic untuk:
- Material → insert ke `material_ins`
- Product (PURCHASE) → insert ke `product_stocks` dengan `source_from: PURCHASE` + `product_stock_detail`

---

### 2. TYPE DEFINITIONS

#### New Types untuk Unified Inventory

```typescript
// src/core/entities/inventory/inventory.ts

/**
 * INVENTORY TYPES - Unified untuk Material & Product Stock In
 */

// Enum untuk inventory type
export enum InventoryItemType {
  MATERIAL = 'MATERIAL',
  PRODUCT = 'PRODUCT',
}

export enum ProductSource {
  PRODUCTION = 'PRODUCTION',
  PURCHASE = 'PURCHASE',
}

// ============================================================================
// BASE UNIFIED INVENTORY STOCK IN REQUEST
// ============================================================================

export type TInventoryStockInCreateRequest = {
  item_type: InventoryItemType;           // 'MATERIAL' or 'PRODUCT'
  item_id: number;                        // material_id or product_id
  quantity: number;
  unit_quantity: string;
  price: number;
  supplier_id: number;
  
  // Optional metadata
  notes?: string;
  received_date?: string;                 // ISO date string
};

// ============================================================================
// MATERIAL-SPECIFIC (extends base)
// ============================================================================

export type TMaterialStockInCreateRequest = Omit<
  TInventoryStockInCreateRequest, 
  'item_type'
> & {
  item_type: InventoryItemType.MATERIAL;
  material_id?: number;                   // Alias untuk item_id
  material?: TMaterialCreate;             // Create new material on-the-fly
};

// ============================================================================
// PRODUCT-SPECIFIC (extends base)
// ============================================================================

export type TProductStockInCreateRequest = Omit<
  TInventoryStockInCreateRequest, 
  'item_type'
> & {
  item_type: InventoryItemType.PRODUCT;
  product_id?: number;                    // Alias untuk item_id
  source_from: ProductSource.PURCHASE;    // Always PURCHASE for stock in
};

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export type TInventoryStockInResponse = {
  id: number;
  item_type: InventoryItemType;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_quantity: string;
  price: number;
  supplier_id: number;
  supplier_name: string;
  source_from?: ProductSource;            // Only for products
  received_at: Date;
  created_at: Date;
  updated_at: Date;
};

// Inventory summary after stock in
export type TInventoryStockSummaryResponse = {
  item_type: InventoryItemType;
  item_id: number;
  item_name: string;
  total_stock_in: number;
  total_stock_out: number;
  current_stock: number;
  unit_quantity: string;
  last_updated: Date;
};
```

---

### 3. VALIDATION SCHEMA (Zod)

```typescript
// src/transports/api/validations/inventory.validation.ts

import z from 'zod';
import { InventoryItemType, ProductSource } from '../../../core/entities/inventory/inventory';

// Base schema untuk inventory stock in
export const inventoryStockInSchema = z.object({
  body: z.object({
    item_type: z.nativeEnum(InventoryItemType, {
      errorMap: () => ({ message: 'item_type must be MATERIAL or PRODUCT' })
    }),
    item_id: z.number().int().positive('item_id must be a positive integer'),
    quantity: z.number().positive('quantity must be positive'),
    unit_quantity: z.string().min(1, 'unit_quantity is required'),
    price: z.number().nonnegative('price must be non-negative'),
    supplier_id: z.number().int().positive('supplier_id is required'),
    notes: z.string().optional(),
    received_date: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      // Validation: item_type harus match dengan business rules
      return true; // Additional custom validation bisa ditambahkan
    },
    { message: 'Invalid inventory item configuration' }
  ),
});

// Alternative: Separate schemas dengan discriminated union
export const materialStockInSchema = z.object({
  body: z.object({
    item_type: z.literal(InventoryItemType.MATERIAL),
    item_id: z.number().int().positive(),
    quantity: z.number().positive(),
    unit_quantity: z.string().min(1),
    price: z.number().nonnegative(),
    supplier_id: z.number().int().positive(),
    material_id: z.number().int().positive().optional(), // Alias
    material: z.object({
      name: z.string().min(1),
      is_active: z.boolean().optional(),
    }).optional(),
  })
});

export const productStockInSchema = z.object({
  body: z.object({
    item_type: z.literal(InventoryItemType.PRODUCT),
    item_id: z.number().int().positive(),
    quantity: z.number().positive(),
    unit_quantity: z.string().min(1),
    price: z.number().nonnegative(),
    supplier_id: z.number().int().positive(),
    product_id: z.number().int().positive().optional(), // Alias
    source_from: z.literal(ProductSource.PURCHASE), // Always PURCHASE
  })
});
```

---

### 4. SERVICE LAYER (Business Logic)

```typescript
// src/core/services/InventoryService.ts

import { InventoryItemType, ProductSource } from '../entities/inventory/inventory';
import type { 
  TInventoryStockInCreateRequest,
  TInventoryStockSummaryResponse 
} from '../entities/inventory/inventory';
import MaterialRepository from '../../adapters/postgres/repositories/MaterialRepository';
import ProductRepository from '../../adapters/postgres/repositories/ProductRepository';

export class InventoryService {
  constructor(
    private materialRepository: MaterialRepository,
    private productRepository: ProductRepository
  ) {}

  /**
   * UNIFIED STOCK IN METHOD
   * Handles both Material and Product stock in
   */
  async stockIn(
    data: TInventoryStockInCreateRequest
  ): Promise<TInventoryStockSummaryResponse> {
    
    // Route to appropriate handler based on item_type
    switch (data.item_type) {
      case InventoryItemType.MATERIAL:
        return this.handleMaterialStockIn(data);
      
      case InventoryItemType.PRODUCT:
        return this.handleProductStockIn(data);
      
      default:
        throw new Error(`Unsupported inventory item type: ${data.item_type}`);
    }
  }

  /**
   * MATERIAL STOCK IN HANDLER
   */
  private async handleMaterialStockIn(
    data: TInventoryStockInCreateRequest
  ): Promise<TInventoryStockSummaryResponse> {
    
    // 1. Create material stock in record
    await this.materialRepository.createStockIn({
      materialId: data.item_id,
      quantity: data.quantity,
      price: data.price,
      quantityUnit: data.unit_quantity,
    });

    // 2. Get material with all stocks
    const material = await this.materialRepository.getMaterialWithStocks(data.item_id);
    
    if (!material) {
      throw new Error(`Material with ID ${data.item_id} not found`);
    }

    // 3. Calculate totals
    const totalStockIn = material.materialIn.reduce((sum, item) => sum + item.quantity, 0);
    const totalStockOut = material.materialOut.reduce((sum, item) => sum + item.quantity, 0);
    const currentStock = totalStockIn - totalStockOut;

    // 4. Return summary
    return {
      item_type: InventoryItemType.MATERIAL,
      item_id: material.id,
      item_name: material.name,
      total_stock_in: totalStockIn,
      total_stock_out: totalStockOut,
      current_stock: currentStock,
      unit_quantity: data.unit_quantity,
      last_updated: material.updatedAt,
    };
  }

  /**
   * PRODUCT STOCK IN HANDLER (NEW!)
   */
  private async handleProductStockIn(
    data: TInventoryStockInCreateRequest
  ): Promise<TInventoryStockSummaryResponse> {
    
    // 1. Create product stock record with PURCHASE source
    const stockRecord = await this.productRepository.createStockIn({
      productId: data.item_id,
      quantity: data.quantity,
      sourceFr: ProductSource.PURCHASE,
      price: data.price,
      supplierId: data.supplier_id,
    });

    // 2. Get product with all stocks
    const product = await this.productRepository.getProductWithStocks(data.item_id);
    
    if (!product) {
      throw new Error(`Product with ID ${data.item_id} not found`);
    }

    // 3. Calculate totals (filter by source)
    const totalStockIn = product.stocks
      .filter(s => s.sourceFr === ProductSource.PURCHASE)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const totalStockOut = 0; // Products don't have "stock out" - sold via orders
    const currentStock = product.stocks.reduce((sum, item) => sum + item.quantity, 0);

    // 4. Return summary
    return {
      item_type: InventoryItemType.PRODUCT,
      item_id: product.id,
      item_name: product.name,
      total_stock_in: totalStockIn,
      total_stock_out: totalStockOut,
      current_stock: currentStock,
      unit_quantity: data.unit_quantity,
      last_updated: product.updatedAt,
    };
  }
}
```

---

### 5. REPOSITORY LAYER (New Methods)

```typescript
// src/adapters/postgres/repositories/ProductRepository.ts

export class ProductRepository {
  
  /**
   * Create Product Stock In (from PURCHASE)
   */
  async createStockIn(data: {
    productId: number;
    quantity: number;
    sourceFr: ProductSource;
    price: number;
    supplierId: number;
  }): Promise<ProductStockEntity> {
    
    // Create stock record
    const stock = await this.prisma.productStock.create({
      data: {
        product_id: data.productId,
        quantity: data.quantity,
        date: new Date(),
        source_from: data.sourceFr,
        
        // Create detail for PURCHASE source
        detail: {
          create: {
            price: data.price,
            supplier_id: data.supplierId,
          }
        }
      },
      include: {
        products: true,
        detail: {
          include: {
            supplier: true,
          }
        }
      }
    });

    // Map to entity
    return this.stockMapper.mapToEntity(stock);
  }

  /**
   * Get Product with All Stocks
   */
  async getProductWithStocks(productId: number): Promise<ProductWithStocksEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        stocks: {
          include: {
            detail: {
              include: {
                supplier: true
              }
            }
          }
        }
      }
    });

    if (!product) return null;

    return this.productWithStocksMapper.mapToEntity(product);
  }
}
```

---

### 6. CONTROLLER LAYER

```typescript
// src/transports/api/controllers/InventoryController.ts

import { Request, Response } from 'express';
import { InventoryService } from '../../../core/services/InventoryService';
import { TInventoryStockInCreateRequest } from '../../../core/entities/inventory/inventory';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  /**
   * UNIFIED STOCK IN ENDPOINT
   * POST /inventory/in
   */
  stockIn = () => {
    return async (req: Request, res: Response) => {
      const data: TInventoryStockInCreateRequest = req.body;
      
      try {
        const result = await this.inventoryService.stockIn(data);
        
        return res.status(200).json({
          status: 'success',
          message: `${data.item_type} stock in recorded successfully`,
          data: result,
        });
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: error instanceof Error ? error.message : 'Stock in failed',
        });
      }
    };
  };
}
```

---

### 7. ROUTER LAYER

```typescript
// src/transports/api/routers/v1/inventory.ts (NEW FILE!)

import express from 'express';
import { InventoryController } from '../../controllers/InventoryController';
import { validate } from '../../validations/validate.middleware';
import { inventoryStockInSchema } from '../../validations/inventory.validation';
import { InventoryService } from '../../../../core/services/InventoryService';
import MaterialRepository from '../../../../adapters/postgres/repositories/MaterialRepository';
import ProductRepository from '../../../../adapters/postgres/repositories/ProductRepository';

const router = express.Router();

// Initialize dependencies
const materialRepository = new MaterialRepository();
const productRepository = new ProductRepository();
const inventoryService = new InventoryService(materialRepository, productRepository);
const inventoryController = new InventoryController(inventoryService);

// POST /inventory/in - Unified stock in endpoint
router.post(
  '/in',
  validate(inventoryStockInSchema),
  inventoryController.stockIn()
);

// GET /inventory/stocks - List all inventory stocks (future)
// router.get('/stocks', inventoryController.getStocksList());

// GET /inventory/summary - Inventory summary report (future)
// router.get('/summary', inventoryController.getSummary());

export default router;
```

```typescript
// src/transports/api/routers/v1/index.ts (UPDATE)

import inventoryRouter from './inventory';  // NEW!

// ... existing imports

router.use('/inventory', inventoryRouter);  // NEW ROUTE!
router.use('/materials', materialRouter);   // Keep for backward compatibility
router.use('/products', productRouter);
// ... other routes
```

---

## 📋 REQUEST/RESPONSE EXAMPLES

### Example 1: Material Stock In

**Request:**
```http
POST /api/v1/inventory/in
Content-Type: application/json

{
  "item_type": "MATERIAL",
  "item_id": 123,
  "quantity": 50,
  "unit_quantity": "kg",
  "price": 15000,
  "supplier_id": 5,
  "notes": "Tepung terigu protein tinggi"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "MATERIAL stock in recorded successfully",
  "data": {
    "item_type": "MATERIAL",
    "item_id": 123,
    "item_name": "Tepung Terigu",
    "total_stock_in": 120,
    "total_stock_out": 50,
    "current_stock": 70,
    "unit_quantity": "kg",
    "last_updated": "2025-10-30T10:30:00.000Z"
  }
}
```

---

### Example 2: Product Stock In (Purchase)

**Request:**
```http
POST /api/v1/inventory/in
Content-Type: application/json

{
  "item_type": "PRODUCT",
  "item_id": 456,
  "quantity": 100,
  "unit_quantity": "botol",
  "price": 5000,
  "supplier_id": 8,
  "notes": "Coca-Cola 330ml"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "PRODUCT stock in recorded successfully",
  "data": {
    "item_type": "PRODUCT",
    "item_id": 456,
    "item_name": "Coca-Cola 330ml",
    "total_stock_in": 300,
    "total_stock_out": 0,
    "current_stock": 300,
    "unit_quantity": "botol",
    "last_updated": "2025-10-30T10:35:00.000Z"
  }
}
```

---

## 🔄 MIGRATION STRATEGY

### Phase 1: Create New Endpoint (Recommended)
```
1. Create /inventory/in endpoint baru
2. Keep /materials/in endpoint existing (backward compatibility)
3. Test /inventory/in dengan MATERIAL type
4. Test /inventory/in dengan PRODUCT type
5. Deprecate /materials/in setelah semua client migrate
```

### Phase 2: Update Frontend
```
1. Update UI untuk pilih inventory type (MATERIAL/PRODUCT)
2. Update form submit ke /inventory/in
3. Handle response format baru
4. Add product stock in feature
```

### Phase 3: Data Migration (If Needed)
```
1. Existing material_ins data → tetap di table yang sama
2. New product purchases → masuk ke product_stocks dengan source_from: PURCHASE
3. No migration needed, cukup update application logic
```

---

## ✅ CHECKLIST IMPLEMENTASI

### Backend Changes

- [ ] **Types**
  - [ ] Create `src/core/entities/inventory/inventory.ts`
  - [ ] Define `InventoryItemType`, `ProductSource` enums
  - [ ] Define `TInventoryStockInCreateRequest` type
  - [ ] Define `TInventoryStockSummaryResponse` type

- [ ] **Validation**
  - [ ] Create `src/transports/api/validations/inventory.validation.ts`
  - [ ] Define `inventoryStockInSchema` (Zod)
  - [ ] Add validation untuk item_type MATERIAL/PRODUCT

- [ ] **Service Layer**
  - [ ] Create `src/core/services/InventoryService.ts`
  - [ ] Implement `stockIn()` method dengan routing logic
  - [ ] Implement `handleMaterialStockIn()` method
  - [ ] Implement `handleProductStockIn()` method

- [ ] **Repository Layer**
  - [ ] Update `ProductRepository.ts`
  - [ ] Add `createStockIn()` method untuk product
  - [ ] Add `getProductWithStocks()` method
  - [ ] Create ProductStockMapper

- [ ] **Controller**
  - [ ] Create `src/transports/api/controllers/InventoryController.ts`
  - [ ] Implement `stockIn()` controller method

- [ ] **Router**
  - [ ] Create `src/transports/api/routers/v1/inventory.ts`
  - [ ] Register `/inventory/in` route
  - [ ] Update `src/transports/api/routers/v1/index.ts`

- [ ] **Testing**
  - [ ] Unit test untuk InventoryService
  - [ ] Integration test untuk /inventory/in endpoint
  - [ ] Test material stock in flow
  - [ ] Test product stock in flow
  - [ ] Test validation errors

### Frontend Changes

- [ ] **UI Components**
  - [ ] Add inventory type selector (MATERIAL/PRODUCT)
  - [ ] Update form untuk handle both types
  - [ ] Add product selector (when PRODUCT selected)
  - [ ] Update API call ke /inventory/in

- [ ] **Features**
  - [ ] Material stock in form (existing, migrate)
  - [ ] Product stock in form (new feature)
  - [ ] Unified inventory list/report

---

## 🎯 BENEFITS

### Business Benefits
1. **Unified Process**: Satu cara untuk semua stock in operations
2. **Better Tracking**: Clear separation antara production vs purchase products
3. **Scalability**: Mudah add inventory types baru (e.g., packaging, consumables)
4. **Reporting**: Easier untuk consolidated inventory reports
5. **User Experience**: Consistent flow untuk staff

### Technical Benefits
1. **Single Endpoint**: `/inventory/in` untuk semua stock in
2. **Type Safety**: Strong typing dengan discriminated unions
3. **Maintainability**: Centralized business logic di InventoryService
4. **Extensibility**: Easy to add new inventory types
5. **Clean Architecture**: Clear separation of concerns

---

## 📊 COMPARISON TABLE

| Aspect | Before | After |
|--------|--------|-------|
| **Endpoints** | `/materials/in` only | `/inventory/in` (unified) |
| **Item Types** | Material only | Material + Product + (future types) |
| **Stock Tables** | `material_ins` | `material_ins` + `product_stocks` |
| **Product Source** | N/A | `PRODUCTION` vs `PURCHASE` |
| **Code Duplication** | N/A | Reduced via InventoryService |
| **Validation** | Material-specific | Generic + type-specific |
| **Scalability** | Limited | High |
| **Reporting** | Separate | Can be unified |

---

## 🚀 NEXT STEPS

1. **Review & Approve** design ini
2. **Create Types** di `/src/core/entities/inventory/`
3. **Implement Service** `InventoryService.ts`
4. **Update Repository** `ProductRepository.ts`
5. **Create Controller** `InventoryController.ts`
6. **Create Router** `/inventory` routes
7. **Write Tests** untuk semua layer
8. **Update Documentation** API docs
9. **Frontend Integration** update UI
10. **Deploy & Monitor** rollout gradually

---

## 💡 FUTURE ENHANCEMENTS

1. **Batch Import**: Upload CSV untuk multiple stock ins
2. **Barcode Scanning**: Scan barcode untuk quick entry
3. **Stock Alerts**: Notify when stock low
4. **Approval Workflow**: Require approval untuk large purchases
5. **Cost Analysis**: Track purchase costs over time
6. **Supplier Rating**: Rate suppliers based on delivery, quality
7. **Inventory Forecast**: Predict stock needs based on history

---

## ⚠️ CONSIDERATIONS

### Backward Compatibility
- Keep `/materials/in` endpoint selama transition period
- Add deprecation warning di response header
- Set sunset date untuk old endpoint

### Data Consistency
- Ensure atomic transactions (stock + detail)
- Handle race conditions dengan proper locking
- Validate supplier exists untuk both types

### Performance
- Index `item_type` + `item_id` untuk faster queries
- Consider caching untuk frequently accessed items
- Optimize stock calculation queries

### Security
- Validate user permissions per inventory type
- Log all stock in operations untuk audit
- Prevent negative stock scenarios

---

## 📝 CONCLUSION

Perubahan dari `/materials/in` ke `/inventory/in` adalah **strategic improvement** yang:
- ✅ Unifies stock in process untuk Material & Product
- ✅ Leverages existing database schema (ProductStock dengan source_from)
- ✅ Follows clean architecture principles
- ✅ Scalable untuk future inventory types
- ✅ Improves user experience dengan consistent flow

**Recommendation**: **Proceed with implementation** menggunakan phased approach untuk minimize risk dan ensure smooth transition.
