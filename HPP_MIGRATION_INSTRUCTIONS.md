# Required Database Migration for HPP Field

To complete the implementation of the HPP (Harga Pokok Penjualan) field, run the following Prisma migration:

## Option 1: Create and run a migration
```bash
npx prisma migrate dev --name add_hpp_to_products
```

## Option 2: Direct database alteration (if you prefer not to use Prisma migrations)
```sql
ALTER TABLE product_menus ADD COLUMN hpp FLOAT DEFAULT 0;
```

## Prisma Schema Update
You'll also need to update your Prisma schema (`prisma/schema.prisma`) to include:

```prisma
model Product {
  // ... existing fields
  hpp       Float?   @default(0)  // Harga Pokok Penjualan (Cost of Goods Sold)
  // ... rest of the model
}
```

After running the migration, re-generate Prisma client:
```bash
npm run prisma:generate
```

Then restart the development server:
```bash
npm run start:dev
```