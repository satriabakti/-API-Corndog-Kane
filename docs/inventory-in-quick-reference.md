# Quick Reference: `/inventory/in` Implementation

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                                │
│  POST /api/v1/inventory/in                                      │
│  {                                                               │
│    "item_type": "MATERIAL" | "PRODUCT",                         │
│    "item_id": 123,                                               │
│    "quantity": 50,                                               │
│    "price": 15000,                                               │
│    "supplier_id": 5                                              │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ROUTER: /inventory/in                               │
│              Middleware: validate(inventoryStockInSchema)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONTROLLER: InventoryController                     │
│              Extract body → Call service                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVICE: InventoryService.stockIn()                 │
│              Route by item_type ────────┬───────────────────┐   │
│                                         ▼                   ▼   │
│                          handleMaterialStockIn()  handleProductStockIn()
└─────────────────────────┬───────────────────────────┬───────────┘
                          │                           │
                          ▼                           ▼
           ┌──────────────────────────┐  ┌──────────────────────────┐
           │  MaterialRepository      │  │  ProductRepository       │
           │  - createStockIn()       │  │  - createStockIn()       │
           │  - getMaterialWithStocks │  │  - getProductWithStocks  │
           └──────────┬───────────────┘  └────────────┬─────────────┘
                      │                               │
                      ▼                               ▼
           ┌──────────────────────────┐  ┌──────────────────────────┐
           │  DB: material_ins        │  │  DB: product_stocks      │
           │  (existing table)        │  │  + product_stock_detail  │
           └──────────────────────────┘  └──────────────────────────┘
```

## 📊 Data Flow Comparison

### MATERIAL Flow
```
Request (MATERIAL)
  ↓
InventoryService.stockIn()
  ↓
handleMaterialStockIn()
  ↓
MaterialRepository.createStockIn()
  ↓
INSERT INTO material_ins (
  material_id,
  quantity,
  price,
  quantity_unit,
  received_at
)
  ↓
Calculate totals (stock in - stock out)
  ↓
Return inventory summary
```

### PRODUCT Flow (NEW!)
```
Request (PRODUCT)
  ↓
InventoryService.stockIn()
  ↓
handleProductStockIn()
  ↓
ProductRepository.createStockIn()
  ↓
BEGIN TRANSACTION
  INSERT INTO product_stocks (
    product_id,
    quantity,
    source_from: 'PURCHASE',
    date
  )
  ↓
  INSERT INTO product_stock_detail (
    stock_id,
    price,
    supplier_id
  )
COMMIT
  ↓
Calculate totals (all stocks by source)
  ↓
Return inventory summary
```

## 🗂️ File Structure

```
src/
├── core/
│   ├── entities/
│   │   ├── inventory/
│   │   │   └── inventory.ts           ← NEW! Unified types
│   │   ├── material/
│   │   │   └── material.ts            ← Existing
│   │   └── product/
│   │       └── product.ts             ← Existing
│   │
│   ├── services/
│   │   ├── InventoryService.ts        ← NEW! Unified service
│   │   ├── MaterialService.ts         ← Keep for backward compat
│   │   └── ProductService.ts          ← Existing
│   │
│   └── repositories/
│       ├── material.ts                ← Interface
│       └── product.ts                 ← Interface
│
├── adapters/
│   └── postgres/
│       └── repositories/
│           ├── MaterialRepository.ts  ← Update
│           └── ProductRepository.ts   ← Add new methods
│
└── transports/
    └── api/
        ├── controllers/
        │   ├── InventoryController.ts ← NEW!
        │   ├── MaterialController.ts  ← Keep
        │   └── ProductController.ts   ← Existing
        │
        ├── routers/
        │   └── v1/
        │       ├── inventory.ts       ← NEW! /inventory routes
        │       ├── material.ts        ← Keep /materials routes
        │       └── index.ts           ← Register /inventory
        │
        └── validations/
            ├── inventory.validation.ts ← NEW!
            └── material.validation.ts  ← Existing
```

## 🔑 Key Code Snippets

### 1. Type Definition
```typescript
// src/core/entities/inventory/inventory.ts
export enum InventoryItemType {
  MATERIAL = 'MATERIAL',
  PRODUCT = 'PRODUCT',
}

export type TInventoryStockInCreateRequest = {
  item_type: InventoryItemType;
  item_id: number;
  quantity: number;
  unit_quantity: string;
  price: number;
  supplier_id: number;
};
```

### 2. Service Logic
```typescript
// src/core/services/InventoryService.ts
async stockIn(data: TInventoryStockInCreateRequest) {
  switch (data.item_type) {
    case InventoryItemType.MATERIAL:
      return this.handleMaterialStockIn(data);
    case InventoryItemType.PRODUCT:
      return this.handleProductStockIn(data);
  }
}
```

### 3. Product Repository (NEW)
```typescript
// src/adapters/postgres/repositories/ProductRepository.ts
async createStockIn(data: {
  productId: number;
  quantity: number;
  price: number;
  supplierId: number;
}) {
  return await this.prisma.productStock.create({
    data: {
      product_id: data.productId,
      quantity: data.quantity,
      source_from: 'PURCHASE',
      date: new Date(),
      detail: {
        create: {
          price: data.price,
          supplier_id: data.supplierId,
        }
      }
    }
  });
}
```

### 4. Router
```typescript
// src/transports/api/routers/v1/inventory.ts
router.post(
  '/in',
  validate(inventoryStockInSchema),
  inventoryController.stockIn()
);
```

## 🧪 Test Cases

### Material Stock In
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Content-Type: application/json" \
  -d '{
    "item_type": "MATERIAL",
    "item_id": 123,
    "quantity": 50,
    "unit_quantity": "kg",
    "price": 15000,
    "supplier_id": 5
  }'
```

### Product Stock In
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Content-Type: application/json" \
  -d '{
    "item_type": "PRODUCT",
    "item_id": 456,
    "quantity": 100,
    "unit_quantity": "pcs",
    "price": 5000,
    "supplier_id": 8
  }'
```

## ⚡ Implementation Priority

### Phase 1: Core (Week 1)
- [ ] Create inventory types
- [ ] Create InventoryService
- [ ] Update ProductRepository
- [ ] Create validation schemas

### Phase 2: API (Week 1-2)
- [ ] Create InventoryController
- [ ] Create inventory router
- [ ] Add unit tests
- [ ] Add integration tests

### Phase 3: Integration (Week 2)
- [ ] Register routes
- [ ] Test material flow
- [ ] Test product flow
- [ ] Update API docs

### Phase 4: Migration (Week 3)
- [ ] Keep /materials/in active
- [ ] Add deprecation notice
- [ ] Update frontend
- [ ] Monitor usage

## 📈 Success Metrics

- ✅ Both MATERIAL and PRODUCT can stock in via same endpoint
- ✅ No breaking changes to existing /materials/in
- ✅ 100% test coverage
- ✅ Response time < 200ms
- ✅ Zero data inconsistencies

## 🚨 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing material flow | Keep /materials/in, gradual migration |
| Product stock calculation wrong | Comprehensive testing, validate against manual count |
| Supplier validation fails | Add proper error handling + rollback |
| Race conditions | Use database transactions |
| Performance degradation | Add indexes, monitor query performance |
