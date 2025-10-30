# Inventory Stock In API - Quick Reference

## Endpoint
```
POST /api/v1/inventory/in
```

## Overview
Unified **batch endpoint** untuk mencatat stok masuk (stock in) baik Material maupun Product. Endpoint ini mendukung **multiple items** dalam satu request untuk efisiensi input data. Endpoint ini menggantikan fungsi `/materials/in` dengan dukungan untuk kedua jenis item.

---

## Request Examples

### 1. Single Material Stock In (dengan Material ID)
```json
POST /api/v1/inventory/in
{
  "items": [
    {
      "item_type": "MATERIAL",
      "quantity": 100,
      "unit_quantity": "kg",
      "price": 50000,
      "supplier_id": 1,
      "material_id": 5
    }
  ]
}
```

### 2. Single Material Stock In (create material baru)
```json
POST /api/v1/inventory/in
{
  "items": [
    {
      "item_type": "MATERIAL",
      "quantity": 50,
      "unit_quantity": "liter",
      "price": 75000,
      "supplier_id": 2,
      "material": {
        "name": "Minyak Goreng Premium",
        "is_active": true
      }
    }
  ]
}
```

### 3. Single Product Stock In (PURCHASE only)
```json
POST /api/v1/inventory/in
{
  "items": [
    {
      "item_type": "PRODUCT",
      "quantity": 30,
      "unit_quantity": "pcs",
      "price": 15000,
      "supplier_id": 3,
      "product_id": 7
    }
  ]
}
```

### 4. **Multiple Items (Mixed Material & Product)**
```json
POST /api/v1/inventory/in
{
  "items": [
    {
      "item_type": "MATERIAL",
      "quantity": 100,
      "unit_quantity": "kg",
      "price": 50000,
      "supplier_id": 1,
      "material_id": 5
    },
    {
      "item_type": "MATERIAL",
      "quantity": 50,
      "unit_quantity": "liter",
      "price": 75000,
      "supplier_id": 2,
      "material": {
        "name": "Minyak Goreng",
        "is_active": true
      }
    },
    {
      "item_type": "PRODUCT",
      "quantity": 30,
      "unit_quantity": "pcs",
      "price": 15000,
      "supplier_id": 3,
      "product_id": 7
    }
  ]
}
```

---

## Response Format

### Success Response - All Items Successful (201 Created)
```json
{
  "status": "success",
  "message": "All 3 items recorded successfully",
  "data": {
    "success_count": 3,
    "failed_count": 0,
    "total_count": 3,
    "items": [
      {
        "id": 123,
        "item_type": "MATERIAL",
        "item_name": "Tepung Terigu",
        "quantity": 100,
        "unit_quantity": "kg",
        "price": 50000,
        "total_price": 5000000,
        "supplier": {
          "id": 1,
          "name": "PT Supplier Utama"
        },
        "current_stock": 250,
        "created_at": "2025-10-31T10:30:00.000Z"
      },
      {
        "id": 124,
        "item_type": "MATERIAL",
        "item_name": "Minyak Goreng",
        "quantity": 50,
        "unit_quantity": "liter",
        "price": 75000,
        "total_price": 3750000,
        "supplier": {
          "id": 2,
          "name": "CV Minyak Sejahtera"
        },
        "current_stock": 50,
        "created_at": "2025-10-31T10:30:05.000Z"
      },
      {
        "id": 125,
        "item_type": "PRODUCT",
        "item_name": "Corndog Original",
        "quantity": 30,
        "unit_quantity": "pcs",
        "price": 15000,
        "total_price": 450000,
        "supplier": {
          "id": 3,
          "name": "PT Product Supplier"
        },
        "current_stock": 80,
        "created_at": "2025-10-31T10:30:08.000Z"
      }
    ]
  },
  "metadata": {}
}
```

### Partial Success Response (207 Multi-Status)
```json
{
  "status": "success",
  "message": "2 items recorded, 1 failed",
  "data": {
    "success_count": 2,
    "failed_count": 1,
    "total_count": 3,
    "items": [
      {
        "id": 123,
        "item_type": "MATERIAL",
        "item_name": "Tepung Terigu",
        "quantity": 100,
        "unit_quantity": "kg",
        "price": 50000,
        "total_price": 5000000,
        "supplier": {
          "id": 1,
          "name": "PT Supplier Utama"
        },
        "current_stock": 250,
        "created_at": "2025-10-31T10:30:00.000Z"
      },
      {
        "id": 124,
        "item_type": "PRODUCT",
        "item_name": "Corndog Original",
        "quantity": 30,
        "unit_quantity": "pcs",
        "price": 15000,
        "total_price": 450000,
        "supplier": {
          "id": 3,
          "name": "PT Product Supplier"
        },
        "current_stock": 80,
        "created_at": "2025-10-31T10:30:05.000Z"
      }
    ],
    "errors": [
      {
        "index": 1,
        "item": {
          "item_type": "MATERIAL",
          "quantity": 50,
          "unit_quantity": "liter",
          "price": 75000,
          "supplier_id": 999,
          "material_id": 5
        },
        "error": "Supplier with ID 999 not found"
      }
    ]
  },
  "metadata": {}
}
```

### Validation Error Response (400 Bad Request)
```json
{
  "status": "error",
  "message": "Validation error",
  "data": null,
  "metadata": {}
}
```

---

## Validation Rules

### Request Structure
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `items` | array | ✅ | Min: 1 item, Max: 100 items per request |

### Common Fields (All Item Types)
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `item_type` | string | ✅ | Must be "MATERIAL" or "PRODUCT" |
| `quantity` | number | ✅ | Must be positive |
| `unit_quantity` | string | ✅ | Min 1 character |
| `price` | number | ✅ | Must be positive |
| `supplier_id` | number | ✅ | Must be valid supplier ID |

### Material-Specific Fields
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `material_id` | number | ❌* | Required if `material` not provided |
| `material.name` | string | ❌* | Required if `material_id` not provided |
| `material.is_active` | boolean | ❌ | Default: true |

**Note:** Untuk Material, harus menyediakan **SALAH SATU** dari `material_id` atau `material`.

### Product-Specific Fields
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `product_id` | number | ✅ | Must be valid product ID |

---

## Business Rules

### Batch Processing
1. **All items processed independently** - Jika satu item gagal, item lain tetap diproses
2. **Partial success allowed** - Response 207 Multi-Status jika ada item yang gagal
3. **Maximum 100 items** per request untuk mencegah timeout
4. **Order preserved** - Items diproses sesuai urutan di array

### Material Stock In
1. Supplier harus exist di database
2. Jika `material_id` disediakan, material harus exist
3. Jika `material` disediakan (create new), akan create material baru dengan supplier yang dipilih
4. Stock dihitung dari total `material_in - material_out`
5. Bisa mix existing material (material_id) dan create new (material) dalam satu request

### Product Stock In
1. Supplier harus exist di database
2. Product harus exist di database
3. **Hanya support `source_from = PURCHASE`** (produk yang dibeli)
4. Stock `source_from = PRODUCTION` akan di-handle endpoint berbeda (future)
5. Stock dihitung hanya dari records dengan `source_from = PURCHASE`

---

## Implementation Details

### Architecture Flow
```
Controller (InventoryController)
    ↓
Service (InventoryService)
    ↓ (routing by item_type)
    ├─→ MaterialRepository (if MATERIAL)
    └─→ ProductRepository (if PRODUCT)
         ↓
    Database (Prisma)
```

### Database Tables Used

**Material Stock In:**
- `materials` - Master data material
- `material_in` - Stock in records
- `material_out` - Stock out records
- `suppliers` - Supplier validation

**Product Stock In:**
- `products` - Master data product
- `product_stocs` - Stock records (quantity, date, source_from)
- `product_stock_detail` - Detail (price, supplier_id)
- `suppliers` - Supplier validation

---

## Error Handling

### HTTP Status Codes
| Status | Meaning | When |
|--------|---------|------|
| 201 | Created | All items processed successfully |
| 207 | Multi-Status | Some items succeeded, some failed (partial success) |
| 400 | Bad Request | Validation error (malformed request) |
| 500 | Internal Server Error | Unexpected server error |

### Error Details in Response
| Error Type | Included In | Description |
|------------|-------------|-------------|
| Validation errors | 400 response | Zod validation errors |
| Item-level errors | `errors` array | Individual item processing failures |

### Common Item Errors
| Error Message | Cause |
|---------------|-------|
| "Supplier with ID X not found" | Invalid `supplier_id` |
| "Product with ID X not found" | Invalid `product_id` for PRODUCT type |
| "Material not found" | Invalid `material_id` for MATERIAL type |
| "Either material_id or material must be provided" | Missing both fields for MATERIAL type |
| "Invalid item_type: X" | item_type bukan "MATERIAL" atau "PRODUCT" |

---

## Migration from /materials/in

### Old Endpoint (Still Active)
```
POST /api/v1/materials/in
```

### New Endpoint
```
POST /api/v1/inventory/in
```

### Migration Guide

**Old Format (Single Item):**
```json
{
  "quantity": 100,
  "suplier_id": 1,
  "material_id": 5,
  "unit_quantity": "kg",
  "price": 50000
}
```

**New Format (Single Item):**
```json
{
  "items": [
    {
      "item_type": "MATERIAL",
      "quantity": 100,
      "supplier_id": 1,
      "material_id": 5,
      "unit_quantity": "kg",
      "price": 50000
    }
  ]
}
```

**New Format (Multiple Items):**
```json
{
  "items": [
    {
      "item_type": "MATERIAL",
      "quantity": 100,
      "supplier_id": 1,
      "material_id": 5,
      "unit_quantity": "kg",
      "price": 50000
    },
    {
      "item_type": "MATERIAL",
      "quantity": 50,
      "supplier_id": 2,
      "material_id": 8,
      "unit_quantity": "liter",
      "price": 75000
    }
  ]
}
```

**Key Changes:**
- ✅ Wrap items in `items` array
- ✅ Add `item_type: "MATERIAL"` to each item
- ⚠️ `suplier_id` → `supplier_id` (typo fix)
- ✅ Response structure changed to batch format
- 🎯 **Can now send multiple items in one request**

---

## Testing Examples

### Using cURL

**Single Material Stock In:**
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "item_type": "MATERIAL",
        "quantity": 100,
        "unit_quantity": "kg",
        "price": 50000,
        "supplier_id": 1,
        "material_id": 5
      }
    ]
  }'
```

**Single Product Stock In:**
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "item_type": "PRODUCT",
        "quantity": 30,
        "unit_quantity": "pcs",
        "price": 15000,
        "supplier_id": 2,
        "product_id": 3
      }
    ]
  }'
```

**Batch: Multiple Items (Mixed Material & Product):**
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "item_type": "MATERIAL",
        "quantity": 100,
        "unit_quantity": "kg",
        "price": 50000,
        "supplier_id": 1,
        "material_id": 5
      },
      {
        "item_type": "MATERIAL",
        "quantity": 50,
        "unit_quantity": "liter",
        "price": 75000,
        "supplier_id": 2,
        "material": {
          "name": "Minyak Goreng Premium",
          "is_active": true
        }
      },
      {
        "item_type": "PRODUCT",
        "quantity": 30,
        "unit_quantity": "pcs",
        "price": 15000,
        "supplier_id": 3,
        "product_id": 7
      }
    ]
  }'
```

**Batch: 10 Materials at Once:**
```bash
curl -X POST http://localhost:3000/api/v1/inventory/in \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"item_type": "MATERIAL", "quantity": 100, "unit_quantity": "kg", "price": 50000, "supplier_id": 1, "material_id": 1},
      {"item_type": "MATERIAL", "quantity": 200, "unit_quantity": "kg", "price": 45000, "supplier_id": 1, "material_id": 2},
      {"item_type": "MATERIAL", "quantity": 50, "unit_quantity": "liter", "price": 75000, "supplier_id": 2, "material_id": 3},
      {"item_type": "MATERIAL", "quantity": 150, "unit_quantity": "kg", "price": 35000, "supplier_id": 1, "material_id": 4},
      {"item_type": "MATERIAL", "quantity": 80, "unit_quantity": "kg", "price": 60000, "supplier_id": 3, "material_id": 5},
      {"item_type": "MATERIAL", "quantity": 120, "unit_quantity": "pcs", "price": 5000, "supplier_id": 2, "material_id": 6},
      {"item_type": "MATERIAL", "quantity": 300, "unit_quantity": "kg", "price": 40000, "supplier_id": 1, "material_id": 7},
      {"item_type": "MATERIAL", "quantity": 60, "unit_quantity": "liter", "price": 80000, "supplier_id": 3, "material_id": 8},
      {"item_type": "MATERIAL", "quantity": 90, "unit_quantity": "kg", "price": 55000, "supplier_id": 2, "material_id": 9},
      {"item_type": "MATERIAL", "quantity": 110, "unit_quantity": "kg", "price": 48000, "supplier_id": 1, "material_id": 10}
    ]
  }'
```

---

## Files Modified/Created

### Created Files
1. `/src/core/entities/inventory/inventory.ts` - Type definitions
2. `/src/core/services/InventoryService.ts` - Business logic
3. `/src/transports/api/controllers/InventoryController.ts` - HTTP handler
4. `/src/transports/api/routers/v1/inventory.ts` - Route definitions
5. `/src/transports/api/validations/inventory.validation.ts` - Zod schemas

### Modified Files
1. `/src/core/repositories/product.ts` - Added interface methods
2. `/src/adapters/postgres/repositories/ProductRepository.ts` - Implemented methods
3. `/src/transports/api/routers/v1/index.ts` - Registered inventory router
4. `/src/transports/api/controllers/index.ts` - Exported InventoryController
5. `/src/core/services/index.ts` - Exported InventoryService

---

## Future Enhancements

### Phase 2 (Planned)
- ✨ `/inventory/production-in` - Product dari produksi internal (batch support)
- ✨ Ingredient tracking untuk production
- ✨ Recipe management
- ✨ Auto-deduct material stock saat produksi
- 🔄 Transaction rollback untuk batch failures (all-or-nothing mode)

### Phase 3 (Future)
- 📊 Inventory analytics dashboard
- 🔔 Low stock notifications
- 📈 Stock movement history
- 🔄 Stock transfer antar outlet (batch support)
- 📦 Import from CSV/Excel (bulk upload 1000+ items)
- ⚡ Async processing untuk batch besar (webhook notification)

---

## Performance Considerations

### Batch Size Recommendations
| Use Case | Recommended Items | Processing Time |
|----------|------------------|-----------------|
| Single transaction | 1-5 items | < 1 second |
| Daily stock in | 10-50 items | 1-3 seconds |
| Weekly bulk upload | 50-100 items | 3-10 seconds |

### Best Practices
1. **Use batch for efficiency** - Kirim multiple items dalam satu request
2. **Monitor errors array** - Check partial failures untuk re-processing
3. **Avoid max limit** - Don't send exactly 100 items, leave buffer
4. **Group by supplier** - Lebih mudah di-track dan di-audit
5. **Validate before sending** - Check supplier_id dan product_id exist

---

**Status:** ✅ Implemented & Tested (Batch Support)  
**Version:** 2.0.0  
**Date:** 2025-10-31
