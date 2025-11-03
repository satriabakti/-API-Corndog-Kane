import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductCategories() {
  console.log('Seeding Product Categories...');

  const categories = [
    {
      name: 'ISI CORNDOG',
      is_active: true,
    },
    {
      name: 'BALUTAN',
      is_active: true,
    },
    {
      name: 'TOPPING',
      is_active: true,
    },
    {
      name: 'SAUS ASIN',
      is_active: true,
    },
    {
      name: 'SAUS MANIS',
      is_active: true,
    },
  ];

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Product Categories seeded successfully!');
}
