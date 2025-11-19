import 'dotenv/config';
import { seedAll } from './seed/user.seeder';
import { seedProductCategories } from './seed/productCategory.seeder';
import { seedProducts } from './seed/product.seeder';
import { seedSuppliers } from './seed/supplier.seeder';
import { seedMaterials, seedMaterialIns, seedMaterialOuts } from './seed/material.seeder';
import { seedEmployees } from './seed/employee.seeder';
import { seedOutlets, seedOutletSettings, seedOutletEmployees } from './seed/outlet.seeder';
import { seedAttendances } from './seed/attendance.seeder';
import { seedProductMasters, seedProducts as seedProductVariants, seedProductInventories, seedProductStocks } from './seed/productMaster.seeder';
import { seedOrders, seedOrderMaterialUsages } from './seed/order.seeder';
import { seedOutletProductRequests, seedOutletMaterialRequests } from './seed/outletRequest.seeder';
import { seedPayrolls, seedPaymentBatches } from './seed/payroll.seeder';
import { seedLogins } from './seed/login.seeder';
import { seedFinance } from './seed/finance.seeder';

async function main() {
  console.log('🚀 Starting comprehensive database seeding...\n');
  console.log('⏰ This process may take a few minutes...\n');
  
  try {
    // ============================================================================
    // PHASE 1: CORE MODULE - Authentication & Base Data
    // ============================================================================
    console.log('\n📋 PHASE 1: Core Module - Authentication & Base Data\n');
    console.log('═'.repeat(70));
    
    await seedAll(); // Roles and Users
    await seedLogins(); // Login records
    
    // ============================================================================
    // PHASE 2: CORE MODULE - Product Categories & Masters
    // ============================================================================
    console.log('\n\n📋 PHASE 2: Core Module - Product Categories\n');
    console.log('═'.repeat(70));
    
    await seedProductCategories(); // Product categories
    console.log('\n\n🏦 PHASE 3: Finance Module - Chart of Accounts\n');
    console.log('═'.repeat(70));
    
    await seedFinance(); // Account categories, accounts, and sample transactions
    
    // ============================================================================
    // COMPLETION
    // ============================================================================
    console.log('\n\n' + '═'.repeat(70));
    console.log('✅ ALL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log('\n📊 Summary:');
    console.log('   - Authentication: Users, Roles, Login Records');
    console.log('   - Products: Categories, Masters, Variants, Inventory, Stocks');
    console.log('   - Warehouse: Suppliers, Materials, Material In/Out');
    console.log('   - HR: Employees, Attendance, Payroll, Payment Batches');
    console.log('   - Outlets: Outlets, Settings, Employee Assignments');
    console.log('   - POS: Orders, Order Items, Material Usage');
    console.log('   - SCM: Product & Material Requests');
    console.log('   - Finance: Account Categories, Accounts, Transactions');
    console.log('\n🎉 Your database is now populated with realistic dummy data!');
    console.log('🔍 Use Prisma Studio to explore: npm run prisma:studio\n');
    
  } catch (error) {
    console.error('\n\n❌ SEEDING FAILED:', error);
    console.error('\nPlease check the error above and try again.');
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
