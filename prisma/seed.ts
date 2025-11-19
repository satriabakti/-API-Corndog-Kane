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
    await seedProductMasters(); // Product masters
    await seedProductVariants(); // Product variants (old products)
    await seedProducts(); // Old product seeder (backward compatibility)
    
    // ============================================================================
    // PHASE 3: WAREHOUSE MODULE - Suppliers & Materials
    // ============================================================================
    console.log('\n\n📦 PHASE 3: Warehouse Module - Suppliers & Materials\n');
    console.log('═'.repeat(70));
    
    await seedSuppliers(); // Suppliers
    await seedMaterials(); // Raw materials
    await seedMaterialIns(); // Material incoming records
    await seedMaterialOuts(); // Material outgoing records
    
    // ============================================================================
    // PHASE 4: WAREHOUSE MODULE - Product Inventory & Stocks
    // ============================================================================
    console.log('\n\n📦 PHASE 4: Warehouse Module - Product Inventory\n');
    console.log('═'.repeat(70));
    
    await seedProductInventories(); // Bill of Materials (BOM)
    await seedProductStocks(); // Product stock records
    
    // ============================================================================
    // PHASE 5: HR MODULE - Employees
    // ============================================================================
    console.log('\n\n👥 PHASE 5: HR Module - Employees\n');
    console.log('═'.repeat(70));
    
    await seedEmployees(); // Employee profiles
    
    // ============================================================================
    // PHASE 6: OUTLETS MODULE - Outlets & Assignments
    // ============================================================================
    console.log('\n\n🏪 PHASE 6: Outlets Module - Outlets & Assignments\n');
    console.log('═'.repeat(70));
    
    await seedOutlets(); // Outlets/Branches
    await seedOutletSettings(); // Outlet settings (work hours, salary)
    await seedOutletEmployees(); // Employee assignments to outlets
    
    // ============================================================================
    // PHASE 7: OUTLETS MODULE - Attendance
    // ============================================================================
    console.log('\n\n📅 PHASE 7: Outlets Module - Attendance\n');
    console.log('═'.repeat(70));
    
    await seedAttendances(); // Employee attendance records
    
    // ============================================================================
    // PHASE 8: POS MODULE - Orders & Sales
    // ============================================================================
    console.log('\n\n💰 PHASE 8: POS Module - Orders & Sales\n');
    console.log('═'.repeat(70));
    
    await seedOrders(); // Orders and order items
    await seedOrderMaterialUsages(); // Material usage per order
    
    // ============================================================================
    // PHASE 9: SCM MODULE - Supply Chain Requests
    // ============================================================================
    console.log('\n\n🚚 PHASE 9: SCM Module - Supply Chain Requests\n');
    console.log('═'.repeat(70));
    
    await seedOutletProductRequests(); // Outlet product requests
    await seedOutletMaterialRequests(); // Outlet material requests
    
    // ============================================================================
    // PHASE 10: HR MODULE - Payroll & Payments
    // ============================================================================
    console.log('\n\n💵 PHASE 10: HR Module - Payroll & Payments\n');
    console.log('═'.repeat(70));
    
    await seedPayrolls(); // Payroll records with bonuses and deductions
    await seedPaymentBatches(); // Payment batches
    
    // ============================================================================
    // PHASE 11: FINANCE MODULE - Chart of Accounts & Transactions
    // ============================================================================
    console.log('\n\n🏦 PHASE 11: Finance Module - Chart of Accounts\n');
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
