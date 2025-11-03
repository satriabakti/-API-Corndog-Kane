# Outlet Request Approval/Rejection with Outlet ID

## Overview
The approval endpoint now requires `outlet_id` to be explicitly provided in the request body instead of using the authenticated user's outlet. This allows managers/admins to approve requests for any outlet.

## Endpoint

**POST** `/outlet-requests/approve`

**Authentication:** Required (JWT Token)

**Authorization:** Manager/Admin role (should have permission to approve requests)

## Request Body Schema

```json
{
  "outlet_id": number,                    // REQUIRED: ID of the outlet for new requests
  "product_requests": [                   // OPTIONAL: Existing product requests to approve
    {
      "request_id": number,
      "approval_quantity": number
    }
  ],
  "material_requests": [                  // OPTIONAL: Existing material requests to approve
    {
      "request_id": number,
      "approval_quantity": number
    }
  ],
  "new_products": [                       // OPTIONAL: New product requests to create
    {
      "id": number,                       // Product ID
      "quantity": number
    }
  ],
  "new_materials": [                      // OPTIONAL: New material requests to create
    {
      "id": number,                       // Material ID
      "quantity": number
    }
  ]
}
```

### Validation Rules
1. **outlet_id**: Must be a positive integer (REQUIRED)
2. At least one of the following arrays must be provided with at least one item:
   - `product_requests`
   - `material_requests`
   - `new_products`
   - `new_materials`
3. **Stock Validation**: For `new_products` and `new_materials`, the requested quantity must not exceed the available stock

## Example Requests

### 1. Approve Existing Requests Only

```bash
curl -X POST http://localhost:3000/outlet-requests/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "outlet_id": 5,
    "product_requests": [
      {
        "request_id": 101,
        "approval_quantity": 50
      },
      {
        "request_id": 102,
        "approval_quantity": 30
      }
    ],
    "material_requests": [
      {
        "request_id": 201,
        "approval_quantity": 100
      }
    ]
  }'
```

### 2. Add New Requests for Specific Outlet

```bash
curl -X POST http://localhost:3000/outlet-requests/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "outlet_id": 3,
    "new_products": [
      {
        "id": 10,
        "quantity": 25
      },
      {
        "id": 15,
        "quantity": 40
      }
    ],
    "new_materials": [
      {
        "id": 5,
        "quantity": 75
      }
    ]
  }'
```

### 3. Combined: Approve Existing + Add New Requests

```bash
curl -X POST http://localhost:3000/outlet-requests/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "outlet_id": 2,
    "product_requests": [
      {
        "request_id": 150,
        "approval_quantity": 60
      }
    ],
    "new_products": [
      {
        "id": 12,
        "quantity": 20
      }
    ],
    "new_materials": [
      {
        "id": 8,
        "quantity": 50
      }
    ]
  }'
```

## Success Response

**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Requests processed successfully",
  "data": {
    "approved_product_requests": [
      {
        "id": "uuid-here",
        "outlet_id": 5,
        "product_id": 10,
        "quantity": 50,
        "approval_quantity": 50,
        "status": "approved",
        "created_at": "2025-11-03T10:00:00Z",
        "updated_at": "2025-11-03T11:00:00Z"
      }
    ],
    "approved_material_requests": [
      {
        "id": "uuid-here",
        "outlet_id": 5,
        "material_id": 5,
        "quantity": 100,
        "approval_quantity": 100,
        "status": "approved",
        "created_at": "2025-11-03T10:00:00Z",
        "updated_at": "2025-11-03T11:00:00Z"
      }
    ],
    "new_product_requests": [
      {
        "id": "uuid-here",
        "outlet_id": 2,
        "product_id": 12,
        "quantity": 20,
        "approval_quantity": null,
        "status": "pending",
        "created_at": "2025-11-03T11:00:00Z",
        "updated_at": "2025-11-03T11:00:00Z"
      }
    ],
    "new_material_requests": [
      {
        "id": "uuid-here",
        "outlet_id": 2,
        "material_id": 8,
        "quantity": 50,
        "approval_quantity": null,
        "status": "pending",
        "created_at": "2025-11-03T11:00:00Z",
        "updated_at": "2025-11-03T11:00:00Z"
      }
    ],
    "total_products": 2,
    "total_materials": 2
  }
}
```

## Error Responses

### 1. Missing outlet_id

**Status Code:** 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "outlet_id",
      "message": "Outlet ID must be a positive integer"
    }
  ]
}
```

### 2. No Items Provided

**Status Code:** 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "product_requests",
      "message": "At least one product, material, new product, or new material must be provided"
    }
  ]
}
```

### 3. Stock Validation Failed

**Status Code:** 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "new_products[0].quantity",
      "message": "Requested quantity (100) exceeds available stock (75) for product ID 12"
    }
  ]
}
```

### 4. Unauthorized

**Status Code:** 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

## Use Cases

### Manager Approving Requests for Multiple Outlets
A manager can approve requests from different outlets by specifying the `outlet_id`:

```javascript
// Approve requests for Outlet A
POST /outlet-requests/approve
{
  "outlet_id": 1,
  "product_requests": [...]
}

// Approve requests for Outlet B
POST /outlet-requests/approve
{
  "outlet_id": 2,
  "product_requests": [...]
}
```

### Creating Pre-approved Requests
A manager can create new requests for an outlet that are immediately created (without approval):

```javascript
POST /outlet-requests/approve
{
  "outlet_id": 5,
  "new_products": [
    { "id": 10, "quantity": 50 }
  ]
}
```

These new requests will be created with `status: "pending"` and can be approved later or in the same request.

## Important Notes

1. **outlet_id is now required**: The outlet_id must be explicitly provided in the request body
2. **No automatic outlet detection**: The endpoint no longer uses the authenticated user's outlet_id
3. **Authorization**: Ensure the authenticated user has permission to approve requests for the specified outlet
4. **Stock validation**: New products and materials are validated against current stock levels
5. **Batch processing**: The endpoint processes both approvals and new request creation in a single transaction
6. **Status changes**: 
   - Approved requests change from `pending` to `approved`
   - New requests are created with `pending` status
7. **Outlet validation**: The system does not automatically validate if the outlet_id exists - this should be handled by application logic or database constraints

## Migration from Old Behavior

**Before** (outlet_id from authenticated user):
```json
{
  "product_requests": [...]
}
```

**After** (outlet_id from request body):
```json
{
  "outlet_id": 5,
  "product_requests": [...]
}
```

Ensure all API consumers update their requests to include the `outlet_id` field.
