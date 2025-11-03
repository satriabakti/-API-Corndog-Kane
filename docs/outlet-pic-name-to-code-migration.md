# Outlet Field Migration: pic_name → code

## Overview
This document describes the migration from `pic_name` to `code` field in the Outlet entity across the entire codebase.

## Database Schema Changes

### Prisma Schema
The `Outlet` model in `prisma/schema.prisma` already had the `code` field:

```prisma
model Outlet {
  id             Int             @id @default(autoincrement())
  name           String
  location       String
  code           String          @default(uuid()) @unique
  pic_phone      String
  // ... other fields
}
```

**Note:** The `code` field:
- Uses `@default(uuid())` to auto-generate unique codes
- Has a `@unique` constraint
- Previously existed but wasn't used in the codebase

## Code Changes Summary

### 1. Core Entities (`src/core/entities/outlet/outlet.ts`)

**Changes:**
- `TOutlet`: `picName: string` → `code: string`
- `TOutletCreateRequest`: `pic_name: string` → `code: string`
- `TOutletGetResponse`: `pic_name: string` → `code: string`
- `TOutletGetResponseWithSettings`: `pic_name: string` → `code: string`
- `TOutletUpdateRequest`: `pic_name?: string` → `code?: string`

### 2. Validation Schemas (`src/transports/api/validations/outlet.validation.ts`)

**createOutletSchema:**
```typescript
// Before
pic_name: z.string().max(50, { message: "PIC Name must be at most 50 characters long" })

// After
code: z.string().max(50, { message: "Code must be at most 50 characters long" })
```

**updateOutletSchema:**
```typescript
// Before
pic_name: z.string().max(50, { message: 'PIC Name must be at most 50 characters long' }).optional()

// After
code: z.string().max(50, { message: 'Code must be at most 50 characters long' }).optional()
```

### 3. Entity Mapper (`src/mappers/mappers/OutletMapperEntity.ts`)

```typescript
// Before
{dbField:"pic_name", entityField:"picName", transform: (v) => MapperUtil.mapNullableString(v as string | null)}

// After
{dbField:"code", entityField:"code", transform: (v) => MapperUtil.mapNullableString(v as string | null)}
```

### 4. Response Mapper (`src/mappers/response-mappers/OutletResponseMapper.ts`)

**toListResponse:**
```typescript
// Before
pic_name: outlet.picName

// After
code: outlet.code
```

**toDetailResponse:**
```typescript
// Before
pic_name: outlet.picName

// After
code: outlet.code
```

### 5. Controller (`src/transports/api/controllers/OutletController.ts`)

**createOutlet:**
```typescript
// Before
picName: outletData.pic_name

// After
code: outletData.code
```

**updateOutlet:**
```typescript
// Before
picName: outletData.pic_name

// After
code: outletData.code
```

### 6. Service Layer (`src/core/services/OutletService.ts`)

**createOutlet method:**
```typescript
// Before
const { name, isActive, picName, picPhone, ... } = item

// After
const { name, isActive, code, picPhone, ... } = item
```

**Repository call:**
```typescript
// Before
this.repository.create({ name, isActive, picName, picPhone, ... })

// After
this.repository.create({ name, isActive, code, picPhone, ... })
```

### 7. Repository (`src/adapters/postgres/repositories/OutletRepository.ts`)

**create method:**
```typescript
// Before
await this.prisma.outlet.create({
  data: {
    pic_name: item.picName as string,
    // ... other fields
  }
})

// After
await this.prisma.outlet.create({
  data: {
    code: item.code as string,
    // ... other fields
  }
})
```

## API Contract Changes

### Request Body Changes

**POST /outlets (Create Outlet)**

Before:
```json
{
  "name": "Main Outlet",
  "location": "123 Main St",
  "pic_name": "John Doe",
  "pic_phone": "081234567890",
  "description": "Main outlet location",
  "is_active": true,
  "setting": {
    "checkin_time": "09:00:00",
    "checkout_time": "17:00:00",
    "salary": "5000000"
  }
}
```

After:
```json
{
  "name": "Main Outlet",
  "location": "123 Main St",
  "code": "OUTLET-001",
  "pic_phone": "081234567890",
  "description": "Main outlet location",
  "is_active": true,
  "setting": {
    "checkin_time": "09:00:00",
    "checkout_time": "17:00:00",
    "salary": "5000000"
  }
}
```

**PUT /outlets/:id (Update Outlet)**

Before:
```json
{
  "name": "Updated Outlet",
  "pic_name": "Jane Smith",
  "pic_phone": "081234567890"
}
```

After:
```json
{
  "name": "Updated Outlet",
  "code": "OUTLET-002",
  "pic_phone": "081234567890"
}
```

### Response Body Changes

**GET /outlets/:id**

Before:
```json
{
  "success": true,
  "message": "Outlet retrieved successfully",
  "data": {
    "id": "1",
    "name": "Main Outlet",
    "location": "123 Main St",
    "pic_name": "John Doe",
    "pic_phone": "081234567890",
    "description": "Main outlet location",
    "is_active": true,
    "created_at": "2025-11-03T10:00:00Z",
    "updated_at": "2025-11-03T10:00:00Z"
  }
}
```

After:
```json
{
  "success": true,
  "message": "Outlet retrieved successfully",
  "data": {
    "id": "1",
    "name": "Main Outlet",
    "location": "123 Main St",
    "code": "OUTLET-001",
    "pic_phone": "081234567890",
    "description": "Main outlet location",
    "is_active": true,
    "created_at": "2025-11-03T10:00:00Z",
    "updated_at": "2025-11-03T10:00:00Z"
  }
}
```

## Migration Steps

1. ✅ **Updated Entity Types** - Changed all TypeScript types to use `code` instead of `picName`
2. ✅ **Updated Validation Schemas** - Changed Zod validation to accept `code` instead of `pic_name`
3. ✅ **Updated Mappers** - Changed entity and response mappers to map `code` field
4. ✅ **Updated Controllers** - Changed controller methods to use `code` from request body
5. ✅ **Updated Services** - Changed service layer to use `code` field
6. ✅ **Updated Repositories** - Changed repository to save `code` to database
7. ✅ **Regenerated Prisma Client** - Ran `npx prisma generate` to update Prisma types
8. ✅ **Verified Build** - Ran `npm run build` successfully with 0 errors

## Database Migration

**Note:** No database migration is required as the `code` field already exists in the schema with the following properties:
- Type: `String`
- Default: `uuid()`
- Unique: `true`

Existing records in the database already have auto-generated UUID values in the `code` field.

## Breaking Changes

⚠️ **API Breaking Changes:**

1. **Request Body Field Renamed:**
   - `pic_name` → `code` in POST and PUT requests
   - Clients must update their request payloads

2. **Response Body Field Renamed:**
   - `pic_name` → `code` in all GET responses
   - Clients must update their response parsing logic

## Validation Changes

The validation for the `code` field remains similar:
- **Max Length:** 50 characters
- **Required:** Yes (for create)
- **Optional:** Yes (for update)

**Recommendation:** If you want to enforce a specific format for codes (e.g., `OUTLET-XXX`), update the validation schema:

```typescript
code: z.string()
  .max(50, { message: 'Code must be at most 50 characters long' })
  .regex(/^OUTLET-\d{3}$/, { message: 'Code must be in format OUTLET-XXX' })
```

## Testing Recommendations

1. **Unit Tests:** Update tests that create or verify outlet data to use `code` instead of `pic_name`
2. **Integration Tests:** Update API tests to send/expect `code` in request/response bodies
3. **Manual Testing:** Test create, update, and read operations with the new field name

## Rollback Plan

If rollback is needed:
1. Revert all code changes using Git
2. Regenerate Prisma client: `npx prisma generate`
3. Rebuild: `npm run build`

The database schema doesn't need rollback as the `code` field already existed.

## Status

✅ **Migration Complete**
- All code updated
- Build successful
- No compilation errors
- Ready for deployment

## Notes

- The `pic_phone` field remains unchanged (still uses snake_case in API)
- The database field `code` uses UUID by default, but can accept custom codes
- The field is unique, so duplicate codes will be rejected by the database
