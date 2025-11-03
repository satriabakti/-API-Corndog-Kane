import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log('Seeding Products...');

  // Get all categories
  const isiCorndogCategory = await prisma.productCategory.findUnique({ where: { name: 'ISI CORNDOG' } });
  const balutanCategory = await prisma.productCategory.findUnique({ where: { name: 'BALUTAN' } });
  const toppingCategory = await prisma.productCategory.findUnique({ where: { name: 'TOPPING' } });
  const sausAsinCategory = await prisma.productCategory.findUnique({ where: { name: 'SAUS ASIN' } });
  const sausManisCategory = await prisma.productCategory.findUnique({ where: { name: 'SAUS MANIS' } });

  if (!isiCorndogCategory || !balutanCategory || !toppingCategory || !sausAsinCategory || !sausManisCategory) {
    throw new Error('Product categories must be seeded first!');
  }

  const products = [
    // ISI CORNDOG
    {
      name: 'Corndog Sosis',
      price: 6000,
      category_id: isiCorndogCategory.id,
      description: 'Corndog dengan isi sosis',
      is_active: true,
    },
    {
      name: 'Corndog Beng-Beng',
      price: 8000,
      category_id: isiCorndogCategory.id,
      description: 'Corndog dengan isi beng-beng',
      is_active: true,
    },
    {
      name: 'Corndog Mix',
      price: 9000,
      category_id: isiCorndogCategory.id,
      description: 'Corndog dengan isi campuran',
      is_active: true,
    },
    {
      name: 'Corndog Mozarella',
      price: 10000,
      category_id: isiCorndogCategory.id,
      description: 'Corndog dengan isi keju mozarella',
      is_active: true,
    },

    // BALUTAN
    {
      name: 'Original (Tepung Roti)',
      price: 0,
      category_id: balutanCategory.id,
      description: 'Balutan tepung roti original - gratis',
      is_active: true,
    },
    {
      name: 'Crumb',
      price: 1000,
      category_id: balutanCategory.id,
      description: 'Balutan crumb',
      is_active: true,
    },
    {
      name: 'Mie',
      price: 2000,
      category_id: balutanCategory.id,
      description: 'Balutan mie',
      is_active: true,
    },
    {
      name: 'Kentang',
      price: 3000,
      category_id: balutanCategory.id,
      description: 'Balutan kentang',
      is_active: true,
    },
    {
      name: 'Corn Flakes Kellogg\'s',
      price: 3000,
      category_id: balutanCategory.id,
      description: 'Balutan corn flakes Kellogg\'s',
      is_active: true,
    },

    // TOPPING
    {
      name: 'Nori',
      price: 0,
      category_id: toppingCategory.id,
      description: 'Topping nori - gratis',
      is_active: true,
    },
    {
      name: 'Chili Powder',
      price: 0,
      category_id: toppingCategory.id,
      description: 'Topping chili powder - gratis',
      is_active: true,
    },
    {
      name: 'Katsoubushi',
      price: 2000,
      category_id: toppingCategory.id,
      description: 'Topping katsoubushi',
      is_active: true,
    },

    // SAUS ASIN (Maks 3) - Semua Rp 1.000
    {
      name: 'Saus Tomat',
      price: 1000,
      category_id: sausAsinCategory.id,
      description: 'Saus tomat (maksimal pilih 3 saus asin)',
      is_active: true,
    },
    {
      name: 'Saus Cabai',
      price: 1000,
      category_id: sausAsinCategory.id,
      description: 'Saus cabai (maksimal pilih 3 saus asin)',
      is_active: true,
    },
    {
      name: 'Saus Keju',
      price: 1000,
      category_id: sausAsinCategory.id,
      description: 'Saus keju (maksimal pilih 3 saus asin)',
      is_active: true,
    },
    {
      name: 'Saus Hot Lava',
      price: 1000,
      category_id: sausAsinCategory.id,
      description: 'Saus hot lava (maksimal pilih 3 saus asin)',
      is_active: true,
    },
    {
      name: 'Mayonaise',
      price: 1000,
      category_id: sausAsinCategory.id,
      description: 'Mayonaise (maksimal pilih 3 saus asin)',
      is_active: true,
    },

    // SAUS MANIS - Semua Rp 1.000
    {
      name: 'Coklat',
      price: 1000,
      category_id: sausManisCategory.id,
      description: 'Saus coklat',
      is_active: true,
    },
    {
      name: 'Tiramisu',
      price: 1000,
      category_id: sausManisCategory.id,
      description: 'Saus tiramisu',
      is_active: true,
    },
    {
      name: 'Green Tea',
      price: 1000,
      category_id: sausManisCategory.id,
      description: 'Saus green tea',
      is_active: true,
    },
    {
      name: 'Strawberry',
      price: 1000,
      category_id: sausManisCategory.id,
      description: 'Saus strawberry',
      is_active: true,
    },
    {
      name: 'Vanilla',
      price: 1000,
      category_id: sausManisCategory.id,
      description: 'Saus vanilla',
      is_active: true,
    },
  ];

  for (const product of products) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name }
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          price: product.price,
          description: product.description,
          is_active: product.is_active,
          category_id: product.category_id,
        },
      });
    } else {
      await prisma.product.create({
        data: product,
      });
    }
  }

  console.log('✅ Products seeded successfully!');
  console.log(`   - ISI CORNDOG: 4 products`);
  console.log(`   - BALUTAN: 5 products`);
  console.log(`   - TOPPING: 3 products`);
  console.log(`   - SAUS ASIN: 5 products`);
  console.log(`   - SAUS MANIS: 5 products`);
  console.log(`   Total: 22 products`);
}
