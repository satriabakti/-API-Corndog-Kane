# Inventory Buy List API Reference

## Overview

The `/inventory/buy` endpoint provides a unified view of all purchase records from both Materials and Products (PURCHASE source only). It combines data from `material_in` table and `product_stocs` table (filtered by `source_from = PURCHASE`).

## Endpoint

```
GET /api/v1/inventory/buy
```

## Features

- **Unified Purchase History**: Combines Material purchases and Product PURCHASE records
- **Pagination Support**: Standard page/limit query parameters
- **Type Discrimination**: Each item tagged with `item_type` (MATERIAL or PRODUCT)
- **Sorted by Date**: Results ordered by purchase date (newest first)
- **Complete Details**: Includes item name, quantity, price, supplier, and purchase date

## Request

### Query Parameters

| Parameter | Type   | Required | Default | Description                    |
|-----------|--------|----------|---------|--------------------------------|
| `page`    | number | No       | 1       | Page number for pagination     |
| `limit`   | number | No       | 10      | Number of items per page       |

### Example Request

```bash
# Get first page with default limit (10 items)
GET /api/v1/inventory/buy?page=1&limit=10

# Get second page with 20 items
GET /api/v1/inventory/buy?page=2&limit=20
```

## Response

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Buy list retrieved successfully",
  "data": [
    {
      "id": 45,
      "item_type": "MATERIAL",
      "item_id": 5,
      "item_name": "Premium Flour",
      "quantity": 100,
      "unit_quantity": "kg",
      "price": 5000000,
      "supplier": {
        "id": 1,
        "name": "Supplier A"
      },
      "purchased_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 78,
      "item_type": "PRODUCT",
      "item_id": 7,
      "item_name": "Product X",
      "quantity": 30,
      "unit_quantity": "pcs",
      "price": 450000,
      "supplier": {
        "id": 2,
        "name": "Supplier B"
      },
      "purchased_at": "2024-01-14T09:15:00.000Z"
    },
    {
      "id": 23,
      "item_type": "MATERIAL",
      "item_id": 8,
      "item_name": "Sugar",
      "quantity": 50,
      "unit_quantity": "kg",
      "price": 600000,
      "supplier": {
        "id": 3,
        "name": "Supplier C"
      },
      "purchased_at": "2024-01-13T14:20:00.000Z"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total_records": 125,
    "total_pages": 13
  }
}
```

### Response Fields

#### Root Response

| Field      | Type   | Description                          |
|------------|--------|--------------------------------------|
| `status`   | string | Response status ("success")          |
| `message`  | string | Success message                      |
| `data`     | array  | Array of buy list items              |
| `metadata` | object | Pagination metadata                  |

#### Metadata Object

| Field           | Type   | Description                          |
|-----------------|--------|--------------------------------------|
| `page`          | number | Current page number                  |
| `limit`         | number | Items per page                       |
| `total_records` | number | Total number of records              |
| `total_pages`   | number | Total number of pages                |

#### Buy List Item

| Field           | Type   | Description                                    |
|-----------------|--------|------------------------------------------------|
| `id`            | number | Unique ID of the purchase record               |
| `item_type`     | string | Type of item: "MATERIAL" or "PRODUCT"          |
| `item_id`       | number | ID of the material or product                  |
| `item_name`     | string | Name of the material or product                |
| `quantity`      | number | Quantity purchased                             |
| `unit_quantity` | string | Unit of measurement (kg, pcs, etc.)            |
| `price`         | number | Price per unit                                 |
| `total_price`   | number | Total price (price × quantity)                 |
| `supplier`      | object | Supplier information                           |
| `purchased_at`  | string | ISO 8601 date string of purchase               |

#### Supplier Object

| Field  | Type   | Description         |
|--------|--------|---------------------|
| `id`   | number | Supplier ID         |
| `name` | string | Supplier name       |

## Data Sources

### Material Purchases

- **Table**: `material_in`
- **Relations**: Includes material name and supplier info
- **Date Field**: `received_at`

### Product Purchases

- **Table**: `product_stocs` + `product_stock_detail`
- **Filter**: Only records where `source_from = 'PURCHASE'`
- **Relations**: Includes product name and supplier info
- **Date Field**: `date`

> **Note**: Product PRODUCTION records are excluded from this endpoint.

## Examples

### Example 1: Get First Page

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/inventory/buy?page=1&limit=5"
```

**Response:**
```json
{
  "status": "success",
  "message": "Buy list retrieved successfully",
  "data": [
    {
      "id": 101,
      "item_type": "PRODUCT",
      "item_id": 15,
      "item_name": "Laptop ABC",
      "quantity": 5,
      "unit_quantity": "pcs",
      "price": 5000000,
      "total_price": 25000000,
      "supplier": {
        "id": 5,
        "name": "Tech Supplier"
      },
      "purchased_at": "2024-01-20T08:00:00.000Z"
    }
    // ... 4 more items
  ],
  "metadata": {
    "page": 1,
    "limit": 5,
    "total_records": 125,
    "total_pages": 25
  }
}
```

### Example 2: Filter by Pagination

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/inventory/buy?page=3&limit=20"
```

**Response:**
```json
{
  "status": "success",
  "message": "Buy list retrieved successfully",
  "data": [
    // Items 41-60
  ],
  "metadata": {
    "page": 3,
    "limit": 20,
    "total_records": 125,
    "total_pages": 7
  }
}
```

## Business Logic

### Combining Data

1. Fetches Material purchases from `material_in` table
2. Fetches Product PURCHASE records from `product_stocs` (filtered)
3. Combines both datasets into unified array
4. Sorts by `purchased_at` date (newest first)
5. Applies pagination to combined results

### Default Values

- **Product unit_quantity**: Defaults to "pcs" if not specified
- **Missing supplier**: Shows "Unknown" if supplier relation is missing

## Migration from `/materials/buy`

### Old Endpoint
```
GET /api/v1/materials/buy
```

### New Endpoint
```
GET /api/v1/inventory/buy
```

### Key Differences

| Aspect              | Old `/materials/buy`        | New `/inventory/buy`                    |
|---------------------|-----------------------------|-----------------------------------------|
| Data Source         | Materials only              | Materials + Products (PURCHASE)         |
| Response Structure  | MaterialStockIn entities    | Unified inventory items with item_type  |
| Product Support     | No                          | Yes (PURCHASE source only)              |
| Type Discrimination | N/A                         | `item_type` field (MATERIAL/PRODUCT)    |
| Field Names         | camelCase entity fields     | snake_case API fields                   |

### Migration Guide

**Old response:**
```json
{
  "data": [
    {
      "id": 1,
      "materialId": 5,
      "quantity": 100,
      "price": 50000,
      "quantityUnit": "kg",
      "receivedAt": "2024-01-15T10:30:00.000Z",
      "material": {
        "name": "Flour",
        "suplier": {
          "id": 1,
          "name": "Supplier A"
        }
      }
    }
  ]
}
```

**New response:**
```json
{
  "status": "success",
  "message": "Buy list retrieved successfully",
  "data": [
    {
      "id": 1,
      "item_type": "MATERIAL",
      "item_id": 5,
      "item_name": "Flour",
      "quantity": 100,
      "unit_quantity": "kg",
      "price": 50000,
      "total_price": 5000000,
      "supplier": {
        "id": 1,
        "name": "Supplier A"
      },
      "purchased_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total_records": 125,
    "total_pages": 13
  }
}
```

## Error Handling

### Server Error (500)

```json
{
  "status": "error",
  "message": "Internal server error",
  "data": null,
  "metadata": {}
}
```

## Performance Considerations

- Uses `Promise.all` for parallel fetching from both data sources
- Includes database relations in single query (no N+1 problem)
- Indexed on `created_at` (Material) and `date` (Product) for fast sorting
- Pagination applied after combining to ensure consistent ordering

## Related Endpoints

- `POST /api/v1/inventory/in` - Create stock in records
- `GET /api/v1/materials/buy` - (Deprecated) Materials-only buy list
- `GET /api/v1/products` - Get all products

## Technical Notes

### Database Tables

**Material Purchase:**
```sql
SELECT m.id, m.material_id, m.quantity, m.price, m.quantity_unit, m.received_at,
       mat.name, s.id as supplier_id, s.name as supplier_name
FROM material_ins m
JOIN materials mat ON m.material_id = mat.id
JOIN suppliers s ON mat.suplier_id = s.id
ORDER BY m.received_at DESC;
```

**Product Purchase:**
```sql
SELECT ps.id, ps.product_id, ps.quantity, ps.date,
       psd.price, psd.supplier_id,
       p.name, s.name as supplier_name
FROM product_stocs ps
JOIN product_stock_detail psd ON ps.id = psd.stock_id
JOIN products p ON ps.product_id = p.id
JOIN suppliers s ON psd.supplier_id = s.id
WHERE ps.source_from = 'PURCHASE'
ORDER BY ps.date DESC;
```

## Changelog

### v1.0.0 (Current)
- Initial release
- Unified Material and Product purchase list
- Pagination support
- Type discrimination with `item_type`
- Sorted by purchase date
