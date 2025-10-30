# Endpoint `/materials/in` - Dokumentasi Alur

## 📌 Overview

Endpoint untuk mencatat **pembelian/penerimaan material (stock in)** dari supplier.

**Base URL**: `POST /api/v1/materials/in`

---

## 🎯 ALUR NON-TEKNIS (Business Flow)

### Konteks Bisnis
Endpoint ini digunakan ketika perusahaan **membeli material dari supplier**. Setiap kali ada pembelian material, staff gudang atau purchasing akan memasukkan data pembelian ke sistem.

### Langkah-langkah Proses Bisnis:

```
1. PURCHASING MELAKUKAN PEMBELIAN
   └─ Membeli material dari supplier
   └─ Mendapat informasi: jumlah, harga, unit

2. INPUT DATA KE SISTEM
   └─ Staff memasukkan data pembelian:
      • Material apa yang dibeli (ID material atau buat baru)
      • Berapa jumlahnya (quantity)
      • Satuan apa (unit: kg, pcs, liter, dll)
      • Harga pembelian
      • Dari supplier mana

3. SISTEM VALIDASI
   └─ Cek apakah data lengkap dan valid
   └─ Pastikan material atau supplier ada di sistem

4. SISTEM MENCATAT TRANSAKSI
   └─ Catat data pembelian ke database
   └─ Hitung total stok material saat ini

5. SISTEM MEMBERIKAN INFORMASI
   └─ Tampilkan ringkasan inventory material:
      • Stok awal
      • Total masuk (stock in)
      • Total keluar (stock out)
      • Stok saat ini
      • Waktu transaksi terakhir

6. PROSES SELESAI
   └─ Stok material bertambah
   └─ Data pembelian tersimpan untuk laporan
```

### Contoh Kasus Penggunaan:

**Skenario**: Restoran membeli 50 kg tepung dari Supplier A seharga Rp 15.000/kg

1. Staff purchasing input data:
   - Material: Tepung Terigu (ID: 123) 
   - Quantity: 50
   - Unit: kg
   - Price: 15000
   - Supplier: Supplier A (ID: 5)

2. Sistem mencatat pembelian

3. Sistem menghitung:
   - Stok sebelumnya: 20 kg
   - Stok masuk hari ini: 50 kg
   - Total stok sekarang: 70 kg

4. Staff mendapat konfirmasi sukses + detail inventory

---

## 🔧 ALUR TEKNIS (Technical Flow)

### Arsitektur Layer

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                     │
│              HTTP POST /materials/in                     │
│              Body: TMaterialStockInCreateRequest         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              TRANSPORT LAYER (API)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Router (material.ts)                          │   │
│  │    - Route: POST /in                             │   │
│  │    - Middleware: validate(stockInSchema)         │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 2. Validation (Zod Schema)                       │   │
│  │    - Validasi request body                       │   │
│  │    - Cek: quantity, price, material_id/material  │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 3. Controller (MaterialController)               │   │
│  │    - Method: stockIn()                           │   │
│  │    - Extract request body                        │   │
│  │    - Call service layer                          │   │
│  └──────────────────┬───────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CORE LAYER (Business Logic)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 4. Service (MaterialService)                     │   │
│  │    - Method: stockIn(data)                       │   │
│  │    - BUSINESS LOGIC:                             │   │
│  │      a. Validasi material_id ada                 │   │
│  │      b. Create stock in via repository           │   │
│  │      c. Get material with all stocks             │   │
│  │      d. Calculate total stock in/out             │   │
│  │      e. Calculate current stock                  │   │
│  │      f. Format response data                     │   │
│  └──────────────────┬───────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            ADAPTER LAYER (Data Access)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 5. Repository (MaterialRepository)               │   │
│  │    - Method: createStockIn(data)                 │   │
│  │    - Method: getMaterialWithStocks(materialId)   │   │
│  │    - Database operations via Prisma              │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 6. EntityMapper                                  │   │
│  │    - Map DB (snake_case) → Entity (camelCase)    │   │
│  │    - MaterialStockInMapperEntity                 │   │
│  │    - MaterialWithStocksMapperEntity              │   │
│  └──────────────────┬───────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                  │
│  Tables:                                                 │
│  - material_in (stock in records)                        │
│  - material (material master)                            │
│  - material_out (stock out records)                      │
│  - suplier (supplier master)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Detail Alur Teknis Step-by-Step

### **Step 1: Router Layer** 
📁 File: `src/transports/api/routers/v1/material.ts`

```typescript
router.post(
  "/in",
  validate(stockInSchema),  // ← Middleware validasi
  materialController.stockIn()  // ← Handler controller
);
```

**Fungsi**: 
- Menerima HTTP POST request
- Pass ke middleware validation
- Forward ke controller

---

### **Step 2: Validation Layer**
📁 File: `src/transports/api/validations/material.validation.ts`

```typescript
export const stockInSchema = z.object({
  body: z.object({
    quantity: z.number().positive(),
    suplier_id: z.number().int().positive(),
    material_id: z.number().int().positive().optional(),
    material: materialCreateSchema.optional(),
    unit_quantity: z.string().min(1),
    price: z.number().positive(),
  }).refine(
    (data) => data.material_id || data.material,
    { message: 'Either material_id or material must be provided' }
  ),
});
```

**Validasi yang Dilakukan**:
- ✅ `quantity`: harus angka positif
- ✅ `suplier_id`: harus integer positif
- ✅ `material_id` ATAU `material`: minimal salah satu harus ada
- ✅ `unit_quantity`: harus string tidak kosong
- ✅ `price`: harus angka positif

**Jika validasi gagal**: Return error 400 Bad Request

---

### **Step 3: Controller Layer**
📁 File: `src/transports/api/controllers/MaterialController.ts`

```typescript
stockIn = () => {
  return async (req: Request, res: Response) => {
    const data: TMaterialStockInCreateRequest = req.body;
    const result = await this.materialService.stockIn(data);
    
    return this.getCustomSuccessResponse(
      res,
      result,
      {} as TMetadataResponse,
      "Stock in created successfully"
    );
  };
}
```

**Tugas Controller**:
1. Extract `req.body` → `TMaterialStockInCreateRequest`
2. Call service: `materialService.stockIn(data)`
3. Wrap result dalam response format standar
4. Return HTTP 200 dengan message sukses

**Type Flow**:
```
Request Body (JSON) 
  → TMaterialStockInCreateRequest (snake_case)
  → Service Layer
  → MaterialInventoryRawData (camelCase)
  → Response (JSON snake_case)
```

---

### **Step 4: Service Layer** (CORE BUSINESS LOGIC)
📁 File: `src/core/services/MaterialService.ts`

```typescript
async stockIn(data: TMaterialStockInCreateRequest): Promise<MaterialInventoryRawData> {
  // 1. VALIDASI
  if (!data.material_id) {
    throw new Error("Material ID is required");
  }

  // 2. CREATE STOCK IN RECORD
  const stockInRecord = await this.repository.createStockIn({
    materialId: data.material_id,
    quantity: data.quantity,
    price: data.price || 0,
    quantityUnit: data.unit_quantity,
  });

  // 3. GET MATERIAL WITH ALL STOCKS
  const material = await this.repository.getMaterialWithStocks(data.material_id);
  
  if (!material) {
    throw new Error("Material not found");
  }

  // 4. CALCULATE STOCK
  const totalStockIn = material.materialIn.reduce((sum, item) => sum + item.quantity, 0);
  const totalStockOut = material.materialOut.reduce((sum, item) => sum + item.quantity, 0);
  const currentStock = totalStockIn - totalStockOut;

  // 5. GET LATEST TIMESTAMPS
  const latestStockIn = material.materialIn[material.materialIn.length - 1]?.createdAt || null;
  const latestStockOut = material.materialOut[material.materialOut.length - 1]?.createdAt || null;

  // 6. FORMAT RESPONSE
  return {
    id: material.id,
    date: formatDate(new Date()),
    name: material.name,
    firstStockCount: material.materialIn[0]?.quantity || 0,
    stockInCount: totalStockIn,
    stockOutCount: totalStockOut,
    currentStock: currentStock,
    unitQuantity: stockInRecord.quantityUnit,
    updatedAt: material.updatedAt,
    outTimes: formatTime(latestStockOut),
    inTimes: formatTime(latestStockIn),
  };
}
```

**Business Logic**:
1. **Validasi**: Cek material_id ada
2. **Create Record**: Simpan data stock in ke DB
3. **Fetch Data**: Ambil material + semua history stocks
4. **Calculate**: Hitung total stock in, stock out, current stock
5. **Timestamps**: Ambil waktu transaksi terakhir
6. **Format**: Return data inventory lengkap

**Type Transformation**:
```
Input:  TMaterialStockInCreateRequest (API format - snake_case)
        { material_id, quantity, unit_quantity, price, suplier_id }
        
Process: CreateStockInInput (Repository format - camelCase)
         { materialId, quantity, quantityUnit, price }
         
Output: MaterialInventoryRawData (Response format - camelCase)
        { id, name, stockInCount, currentStock, ... }
```

---

### **Step 5: Repository Layer**
📁 File: `src/adapters/postgres/repositories/MaterialRepository.ts`

**Method 1**: `createStockIn()`
```typescript
async createStockIn(data: CreateStockInInput): Promise<MaterialStockInEntity> {
  // 1. INSERT to database
  const dbRecord = await this.prisma.materialIn.create({
    data: {
      material_id: data.materialId,
      price: data.price,
      quantity_unit: data.quantityUnit,
      quantity: data.quantity,
    },
    include: {
      material: {
        include: {
          suplier: true,
        },
      },
    },
  });

  // 2. MAP to entity (snake_case → camelCase)
  return this.stockInMapper.mapToEntity(dbRecord);
}
```

**Method 2**: `getMaterialWithStocks()`
```typescript
async getMaterialWithStocks(materialId: number): Promise<MaterialWithStocksEntity | null> {
  // 1. FETCH from database dengan relasi
  const dbRecord = await this.prisma.material.findUnique({
    where: { id: materialId },
    include: {
      material_in: true,   // ← Semua stock in records
      material_out: true,  // ← Semua stock out records
    },
  });

  if (!dbRecord) return null;

  // 2. MAP to entity (snake_case → camelCase)
  return this.materialWithStocksMapper.mapToEntity(dbRecord);
}
```

**Database Operations**:
1. **INSERT**: Create new record di `material_in` table
2. **SELECT**: Fetch material + relasi (material_in, material_out, suplier)
3. **MAPPING**: Transform DB format (snake_case) → Entity (camelCase)

---

### **Step 6: Entity Mapper**
📁 Files: `src/mappers/mappers/MaterialStockInMapperEntity.ts`

```typescript
export const MaterialStockInMapperEntity = {
  mapToEntity(dbData: any): MaterialStockInEntity {
    return {
      id: dbData.id,
      materialId: dbData.material_id,          // snake → camel
      price: dbData.price,
      quantityUnit: dbData.quantity_unit,      // snake → camel
      quantity: dbData.quantity,
      receivedAt: dbData.received_at,          // snake → camel
      createdAt: dbData.createdAt,
      updatedAt: dbData.updatedAt,
      material: {
        name: dbData.material.name,
        suplierId: dbData.material.suplier_id, // snake → camel
        suplier: {
          name: dbData.material.suplier?.name,
        },
      },
    };
  }
};
```

**Fungsi Mapper**:
- Transform database format (snake_case) → Entity format (camelCase)
- Preserve type safety
- Handle nested relations

---

## 📊 Data Type Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    TYPE TRANSFORMATION                        │
└──────────────────────────────────────────────────────────────┘

CLIENT (JSON snake_case)
  {
    "material_id": 123,
    "quantity": 50,
    "unit_quantity": "kg",
    "price": 15000,
    "suplier_id": 5
  }
         │
         ▼
API LAYER: TMaterialStockInCreateRequest (snake_case)
         │
         ▼
SERVICE LAYER: transforms to CreateStockInInput (camelCase)
  {
    materialId: 123,
    quantity: 50,
    quantityUnit: "kg",
    price: 15000
  }
         │
         ▼
REPOSITORY LAYER: Database operation
         │
         ▼
DATABASE (snake_case)
  material_in table:
  {
    material_id: 123,
    quantity: 50,
    quantity_unit: "kg",
    price: 15000,
    received_at: "2025-10-30 10:30:00"
  }
         │
         ▼
ENTITY MAPPER: DB (snake_case) → Entity (camelCase)
         │
         ▼
SERVICE LAYER: MaterialStockInEntity (camelCase)
  {
    id: 456,
    materialId: 123,
    quantity: 50,
    quantityUnit: "kg",
    price: 15000,
    receivedAt: Date,
    ...
  }
         │
         ▼
SERVICE LAYER: Business logic calculation
         │
         ▼
SERVICE LAYER: MaterialInventoryRawData (camelCase)
  {
    id: 123,
    name: "Tepung Terigu",
    stockInCount: 120,
    stockOutCount: 50,
    currentStock: 70,
    ...
  }
         │
         ▼
CONTROLLER: Wrap in response format
         │
         ▼
CLIENT (JSON snake_case)
  {
    "status": "success",
    "message": "Stock in created successfully",
    "data": {
      "id": 123,
      "name": "Tepung Terigu",
      "stock_in_count": 120,
      "current_stock": 70,
      ...
    }
  }
```

---

## 🔄 Sequence Diagram

```
Client    Router    Validator    Controller    Service    Repository    Database
  │          │          │             │            │            │            │
  │─POST─────▶          │             │            │            │            │
  │          │          │             │            │            │            │
  │          │─validate─▶             │            │            │            │
  │          │◀─────OK──│             │            │            │            │
  │          │          │             │            │            │            │
  │          │──────call controller───▶            │            │            │
  │          │          │             │            │            │            │
  │          │          │             │─stockIn()──▶            │            │
  │          │          │             │            │            │            │
  │          │          │             │            │─createStockIn()─────────▶
  │          │          │             │            │            │─INSERT────▶
  │          │          │             │            │◀───────────│◀──result──│
  │          │          │             │            │            │            │
  │          │          │             │            │─getMaterialWithStocks()─▶
  │          │          │             │            │            │─SELECT────▶
  │          │          │             │            │◀───────────│◀──result──│
  │          │          │             │            │            │            │
  │          │          │             │            │[calculate] │            │
  │          │          │             │            │[format]    │            │
  │          │          │             │            │            │            │
  │          │          │             │◀──result───│            │            │
  │          │          │             │            │            │            │
  │          │◀────────response────────│            │            │            │
  │◀─200 OK──│          │             │            │            │            │
  │          │          │             │            │            │            │
```

---

## 📝 Request & Response Examples

### **Request Example**

```http
POST /api/v1/materials/in
Content-Type: application/json

{
  "material_id": 123,
  "quantity": 50,
  "unit_quantity": "kg",
  "price": 15000,
  "suplier_id": 5
}
```

### **Response Example (Success - 200 OK)**

```json
{
  "status": "success",
  "message": "Stock in created successfully",
  "data": {
    "id": 123,
    "date": "2025-10-30",
    "name": "Tepung Terigu",
    "firstStockCount": 20,
    "stockInCount": 120,
    "stockOutCount": 50,
    "currentStock": 70,
    "unitQuantity": "kg",
    "updatedAt": "2025-10-30T10:30:00.000Z",
    "outTimes": "09:15:30",
    "inTimes": "10:30:00"
  },
  "metadata": {}
}
```

### **Response Example (Validation Error - 400)**

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "quantity must be positive"
    }
  ]
}
```

### **Response Example (Business Error - 400/500)**

```json
{
  "status": "error",
  "message": "Material not found"
}
```

---

## 🎯 Key Technical Concepts

### 1. **Hexagonal Architecture (Ports & Adapters)**
- **Core Layer**: Business logic (Service) - tidak tahu tentang database
- **Adapter Layer**: Database operations (Repository) - implementasi detail
- **Transport Layer**: API interface (Controller, Router) - cara akses sistem

### 2. **Dependency Injection**
```typescript
const materialService = new MaterialService(new MaterialRepository());
```
Service tidak create repository sendiri, di-inject dari luar → loosely coupled

### 3. **Type Safety & Transformation**
- API types (snake_case): `TMaterialStockInCreateRequest`
- Entity types (camelCase): `MaterialStockInEntity`
- Repository types: `CreateStockInInput`
- Mapper: Transform between formats

### 4. **Entity Mapper Pattern**
Memisahkan database format dari business logic format:
```
DB (snake_case) → Mapper → Entity (camelCase) → Service
```

### 5. **Validation Layer**
Zod schema memastikan data valid sebelum masuk business logic:
- Type checking runtime
- Custom validation rules
- Auto error messages

---

## ✅ Summary

### Non-Teknis:
1. User input data pembelian material
2. Sistem validasi data
3. Sistem simpan transaksi
4. Sistem hitung stok terkini
5. User dapat laporan inventory

### Teknis:
1. **Router** menerima HTTP request → **Validator**
2. **Validator** (Zod) validasi request body
3. **Controller** extract data → call **Service**
4. **Service** execute business logic:
   - Create stock in via **Repository**
   - Get material with stocks via **Repository**
   - Calculate totals
   - Format response
5. **Repository** perform database operations via Prisma
6. **EntityMapper** transform DB format → Entity format
7. **Controller** wrap result → return HTTP response

**Database Tables Involved**:
- `material_in` (INSERT)
- `material` (SELECT)
- `material_out` (SELECT)
- `suplier` (SELECT - nested)

**Key Pattern**: Request → Validate → Transform → Execute → Calculate → Map → Response
