import 'dotenv/config';
import { seedAll } from './seed/user.seeder';
import { seedProductCategories } from './seed/productCategory.seeder';
import { seedProducts } from './seed/product.seeder';

async function main() {
  console.log('🚀 Starting database seeding...\n');
  
  try {
    // Seed all (roles and users)
    await seedAll();
    
    // Seed product categories first
    await seedProductCategories();
    
    // Then seed products (depends on categories)
    await seedProducts();
    
    console.log('\n✅ All seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
