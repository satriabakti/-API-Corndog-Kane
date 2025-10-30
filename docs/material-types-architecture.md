# Material Types Architecture

## 🎯 Prinsip Desain

**Single Base Type Pattern**: Semua types dalam material domain derived dari **`TMaterial`** sebagai base type, menggunakan TypeScript utility types untuk menghindari duplikasi dan menjaga konsistensi.

## 📁 Struktur

```
src/core/entities/material/
└── material.ts    # Semua material types (140 lines → simplified)
```

## �️ Type Hierarchy

```
TMaterial (BASE TYPE)
├── TMaterialWithID = TMaterial & { id }
│   ├── TMaterialWithStock = TMaterialWithID & { stockQuantity }
│   └── MaterialEntity = Required<TMaterialWithID>
│       └── MaterialWithStocksEntity extends MaterialEntity
├── TMaterialCreate = Omit<TMaterial, 'createdAt' | 'updatedAt'>
│   ├── TMaterialUpdate = Partial<TMaterialCreate>
│   └── TMaterialCreateRequest = Omit<TMaterialCreate, 'isActive'> + { is_active }
│       └── TMaterialUpdateRequest = Partial<TMaterialCreateRequest>
└── TMaterialGetResponse (transformed untuk API)
```

## 🔧 Utility Types Usage

### 1. **Omit<T, K>** - Menghilangkan properties
```typescript
// Base: TMaterial memiliki createdAt & updatedAt
export type TMaterialCreate = Omit<TMaterial, 'createdAt' | 'updatedAt'>;
// Result: name, suplierId, isActive (tanpa timestamps)

export type TMaterialCreateRequest = Omit<TMaterialCreate, 'isActive'> & {
  is_active?: boolean;
};
// Result: name, suplierId, is_active (camelCase → snake_case)
```

### 2. **Pick<T, K>** - Mengambil subset properties
```typescript
export type MaterialInfo = Pick<MaterialEntity, 'name' | 'suplierId'>;
// Result: hanya { name, suplierId }

export type CreateMaterialInput = Pick<MaterialEntity, 'name' | 'suplierId' | 'isActive'>;
// Result: { name, suplierId, isActive }

export type CreateStockInInput = Pick<
  MaterialStockInEntity, 
  'materialId' | 'price' | 'quantityUnit' | 'quantity'
>;
```

### 3. **Partial<T>** - Semua properties jadi optional
```typescript
export type TMaterialUpdate = Partial<TMaterialCreate>;
// Result: Semua field di TMaterialCreate jadi optional

export type TMaterialStockOutUpdateRequest = Partial<TMaterialStockOutCreateRequest>;
// Result: { quantity?, material_id? }
```

### 4. **Required<T>** - Semua properties jadi required
```typescript
export type MaterialEntity = Required<TMaterialWithID>;
// Result: Semua field termasuk isActive, createdAt, updatedAt jadi required
```

### 5. **extends** - Inheritance & Augmentation
```typescript
export interface MaterialWithStocksEntity extends MaterialEntity {
  materialIn: MaterialStockInSimpleEntity[];
  materialOut: MaterialStockOutSimpleEntity[];
}
// Result: MaterialEntity + array stocks
```

### 6. **Generic<T>** - Reusable patterns
```typescript
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export type PaginatedMaterialStockIn = PaginatedResult<MaterialStockInEntity>;
// Bisa digunakan untuk resource lain: PaginatedResult<UserEntity>, dll
```

## 📋 Kategori Types

### 1. BASE TYPES
Foundation untuk seluruh domain:
```typescript
TMaterial                    // Base type
TMaterialWithID             // + id
TMaterialWithStock          // + stockQuantity
TMaterialCreate             // Omit timestamps
TMaterialUpdate             // Partial create
MaterialEntity              // Required version
```

### 2. API REQUEST/RESPONSE TYPES
Types untuk komunikasi dengan client (snake_case properties):
```typescript
TMaterialGetResponse        // GET response
TMaterialCreateRequest      // POST request
TMaterialUpdateRequest      // PUT/PATCH request
TMaterialStockInCreateRequest
TMaterialStockInGetResponse
TMaterialInventoryGetResponse
```

### 3. ENTITY TYPES
Types untuk repository/mapper layer (camelCase properties):
```typescript
MaterialEntity              // Base entity
MaterialStockInEntity       // Stock in entity
MaterialStockOutEntity      // Stock out entity
MaterialWithStocksEntity    // With relations
```

### 4. REPOSITORY TYPES
Input/output contracts untuk repository methods:
```typescript
CreateMaterialInput         // Create operation
CreateStockInInput          // Stock in operation
CreateStockOutInput         // Stock out operation
PaginatedMaterialStockIn    // Paginated result
```

### 5. RAW DATA TYPES
Types untuk mappers (data langsung dari database):
```typescript
MaterialStockInRawData      // Raw stock in from DB
MaterialInventoryRawData    // Raw inventory from DB
```

## ✅ Benefits

1. **DRY (Don't Repeat Yourself)**
   - Semua types derived dari `TMaterial`
   - Tidak ada duplikasi field definitions
   - Utility types mengurangi boilerplate

2. **Single Source of Truth**
   - Update `TMaterial` → semua derived types ter-update
   - Konsisten di seluruh codebase

3. **Type Safety**
   - Strong typing dari API → Service → Repository
   - Compile-time error detection
   - IntelliSense autocomplete

4. **Maintainability**
   - Mudah tracking type relationships
   - Clear type hierarchy
   - Self-documenting code

5. **Scalability**
   - Pattern bisa digunakan untuk domain lain
   - Generic types (PaginatedResult) reusable

## 🎨 Naming Conventions

| Category | Pattern | Example | Format |
|----------|---------|---------|--------|
| Base Types | `T*` | `TMaterial`, `TMaterialWithID` | camelCase |
| API Request | `T*Request` | `TMaterialCreateRequest` | snake_case props |
| API Response | `T*Response` | `TMaterialGetResponse` | snake_case props |
| Entity | `*Entity` | `MaterialEntity` | camelCase props |
| Repository Input | `Create*Input` | `CreateMaterialInput` | camelCase props |
| Repository Output | `Paginated*` | `PaginatedMaterialStockIn` | camelCase props |
| Raw Data | `*RawData` | `MaterialStockInRawData` | mixed case |

## 🔄 Type Flow

```
Client Request (JSON snake_case)
    ↓
TMaterialCreateRequest
    ↓
Service Layer (transform)
    ↓
CreateMaterialInput
    ↓
Repository Layer (database operation)
    ↓
MaterialEntity
    ↓
Service Layer (transform)
    ↓
TMaterialGetResponse
    ↓
Client Response (JSON snake_case)
```

## 📊 Type Composition Examples

### Example 1: Building Create Request from Base
```typescript
TMaterial
  → Omit<TMaterial, 'createdAt' | 'updatedAt'>
  → TMaterialCreate
  → Omit<TMaterialCreate, 'isActive'> & { is_active?: boolean }
  → TMaterialCreateRequest
```

### Example 2: Building Entity from Base
```typescript
TMaterial
  → TMaterial & { id: number }
  → TMaterialWithID
  → Required<TMaterialWithID>
  → MaterialEntity
  → extends MaterialEntity + { materialIn[], materialOut[] }
  → MaterialWithStocksEntity
```

### Example 3: Building Repository Input
```typescript
MaterialStockInEntity
  → Pick<MaterialStockInEntity, 'materialId' | 'price' | 'quantityUnit' | 'quantity'>
  → CreateStockInInput
```

## 🚀 Reusable Patterns

### Generic Pagination
```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// Usage
type PaginatedMaterialStockIn = PaginatedResult<MaterialStockInEntity>;
type PaginatedUsers = PaginatedResult<UserEntity>; // future
type PaginatedProducts = PaginatedResult<ProductEntity>; // future
```

### Standard CRUD Types Pattern
Bisa diaplikasikan ke domain lain:
```typescript
// Base
export type TEntity = { ... }
export type TEntityWithID = TEntity & { id: number }
export type TEntityCreate = Omit<TEntity, 'createdAt' | 'updatedAt'>
export type TEntityUpdate = Partial<TEntityCreate>

// API
export type TEntityCreateRequest = /* transform to snake_case */
export type TEntityGetResponse = /* transform to snake_case */

// Repository
export type CreateEntityInput = Pick<...>
```
