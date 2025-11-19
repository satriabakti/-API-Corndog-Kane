import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedFinance() {
  console.log("🏦 Seeding Finance module...");

  // ============================================================================
  // STEP 1: Create Account Categories (Main Categories)
  // ============================================================================
  const assetCategory = await prisma.accountCategory.upsert({
    where: { name: "Asset" },
    update: {},
    create: {
      name: "Asset",
      description: "Aset perusahaan",
      is_active: true,
    },
  });

  const liabilityCategory = await prisma.accountCategory.upsert({
    where: { name: "Kewajiban" },
    update: {},
    create: {
      name: "Kewajiban",
      description: "Kewajiban perusahaan",
      is_active: true,
    },
  });

  const equityCategory = await prisma.accountCategory.upsert({
    where: { name: "Ekuitas" },
    update: {},
    create: {
      name: "Ekuitas",
      description: "Modal perusahaan",
      is_active: true,
    },
  });

  const revenueCategory = await prisma.accountCategory.upsert({
    where: { name: "Pendapatan" },
    update: {},
    create: {
      name: "Pendapatan",
      description: "Pendapatan perusahaan",
      is_active: true,
    },
  });

  const cogsCategory = await prisma.accountCategory.upsert({
    where: { name: "HPP" },
    update: {},
    create: {
      name: "HPP",
      description: "Harga Pokok Penjualan",
      is_active: true,
    },
  });

  const opexCategory = await prisma.accountCategory.upsert({
    where: { name: "Beban Operasional" },
    update: {},
    create: {
      name: "Beban Operasional",
      description: "Beban operasional perusahaan",
      is_active: true,
    },
  });

  const nonOpexCategory = await prisma.accountCategory.upsert({
    where: { name: "Non-Operasional" },
    update: {},
    create: {
      name: "Non-Operasional",
      description: "Pendapatan dan beban non-operasional",
      is_active: true,
    },
  });

  console.log(`✅ Created 7 account categories`);

  // ============================================================================
  // STEP 2: Create Account Types (Subcategories)
  // ============================================================================
  
  // Asset Types
  const assetLancar = await prisma.accountType.upsert({
    where: { name: "Asset Lancar" },
    update: {
      code: "ASSET_CURRENT",
    },
    create: {
      name: "Asset Lancar",
      code: "ASSET_CURRENT",
      description: "Aset yang mudah dicairkan",
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  const assetTetap = await prisma.accountType.upsert({
    where: { name: "Asset Tetap" },
    update: {
      code: "ASSET_FIXED",
    },
    create: {
      name: "Asset Tetap",
      code: "ASSET_FIXED",
      description: "Aset jangka panjang",
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  // Liability Types
  const kewajibanJangkaPendek = await prisma.accountType.upsert({
    where: { name: "Kewajiban Jangka Pendek" },
    update: {
      code: "LIABILITY_SHORT",
    },
    create: {
      name: "Kewajiban Jangka Pendek",
      code: "LIABILITY_SHORT",
      description: "Kewajiban yang harus dilunasi dalam waktu dekat",
      account_category_id: liabilityCategory.id,
      is_active: true,
    },
  });

  const kewajibanJangkaPanjang = await prisma.accountType.upsert({
    where: { name: "Kewajiban Jangka Panjang" },
    update: {
      code: "LIABILITY_LONG",
    },
    create: {
      name: "Kewajiban Jangka Panjang",
      code: "LIABILITY_LONG",
      description: "Kewajiban jangka panjang",
      account_category_id: liabilityCategory.id,
      is_active: true,
    },
  });

  // Equity Type
  const ekuitas = await prisma.accountType.upsert({
    where: { name: "Ekuitas" },
    update: {
      code: "EQUITY",
    },
    create: {
      name: "Ekuitas",
      code: "EQUITY",
      description: "Modal pemilik",
      account_category_id: equityCategory.id,
      is_active: true,
    },
  });

  // Revenue Type
  const pendapatan = await prisma.accountType.upsert({
    where: { name: "Pendapatan" },
    update: {
      code: "REVENUE",
    },
    create: {
      name: "Pendapatan",
      code: "REVENUE",
      description: "Pendapatan usaha",
      account_category_id: revenueCategory.id,
      is_active: true,
    },
  });

  // COGS Type
  const hargaPokokPenjualan = await prisma.accountType.upsert({
    where: { name: "Harga Pokok Penjualan" },
    update: {
      code: "COGS",
    },
    create: {
      name: "Harga Pokok Penjualan",
      code: "COGS",
      description: "HPP",
      account_category_id: cogsCategory.id,
      is_active: true,
    },
  });

  // Operational Expense Types
  const umumAdmin = await prisma.accountType.upsert({
    where: { name: "Umum & Admin" },
    update: {
      code: "GA_EXPENSE",
    },
    create: {
      name: "Umum & Admin",
      code: "GA_EXPENSE",
      description: "Beban umum dan administrasi",
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  const bebanPenjualanOperasional = await prisma.accountType.upsert({
    where: { name: "Beban Penjualan & Operasional" },
    update: {
      code: "SALES_EXPENSE",
    },
    create: {
      name: "Beban Penjualan & Operasional",
      code: "SALES_EXPENSE",
      description: "Beban penjualan dan operasional",
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  // Non-Operational Types
  const pendapatanNonOperasional = await prisma.accountType.upsert({
    where: { name: "Pendapatan Non-Operasional" },
    update: {
      code: "NON_OP_INCOME",
    },
    create: {
      name: "Pendapatan Non-Operasional",
      code: "NON_OP_INCOME",
      description: "Pendapatan di luar operasional utama",
      account_category_id: nonOpexCategory.id,
      is_active: true,
    },
  });

  const bebanNonOperasional = await prisma.accountType.upsert({
    where: { name: "Beban Non-Operasional" },
    update: {
      code: "NON_OP_EXPENSE",
    },
    create: {
      name: "Beban Non-Operasional",
      code: "NON_OP_EXPENSE",
      description: "Beban di luar operasional utama",
      account_category_id: nonOpexCategory.id,
      is_active: true,
    },
  });

  console.log(`✅ Created 11 account types`);

  // ============================================================================
  // STEP 3: Create Accounts (Indonesian COA Structure from Images)
  // ============================================================================
  
  // ASSET LANCAR (Current Assets)
  const kasAccount = await prisma.account.upsert({
    where: { number: "1101" },
    update: {},
    create: {
      name: "Kas",
      number: "1101",
      balance: 10000000,
      description: "Uang tunai di kasir",
      account_type_id: assetLancar.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  const bankAccount = await prisma.account.upsert({
    where: { number: "1102" },
    update: {},
    create: {
      name: "Bank",
      number: "1102",
      balance: 50000000,
      description: "Rekening bank perusahaan",
      account_type_id: assetLancar.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  const piutangAccount = await prisma.account.upsert({
    where: { number: "1104" },
    update: {},
    create: {
      name: "Piutang Dagang",
      number: "1104",
      balance: 5000000,
      description: "Tagihan kepada pelanggan",
      account_type_id: assetLancar.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  const persediaanAccount = await prisma.account.upsert({
    where: { number: "1106" },
    update: {},
    create: {
      name: "Persediaan Bahan Baku",
      number: "1106",
      balance: 15000000,
      description: "Stok bahan baku corndog",
      account_type_id: assetLancar.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  // ASSET TETAP (Fixed Assets)
  const peralatanAccount = await prisma.account.upsert({
    where: { number: "1401" },
    update: {},
    create: {
      name: "Peralatan Masak",
      number: "1401",
      balance: 25000000,
      description: "Deep fryer, kompor, dll",
      account_type_id: assetTetap.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  const kendaraanAccount = await prisma.account.upsert({
    where: { number: "1402" },
    update: {},
    create: {
      name: "Kendaraan",
      number: "1402",
      balance: 150000000,
      description: "Motor/mobil untuk delivery",
      account_type_id: assetTetap.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  const akumulasiPenyusutanAccount = await prisma.account.upsert({
    where: { number: "1403" },
    update: {},
    create: {
      name: "Akumulasi Penyusutan",
      number: "1403",
      balance: 0,
      description: "Akumulasi penyusutan aset tetap",
      account_type_id: assetTetap.id,
      account_category_id: assetCategory.id,
      is_active: true,
    },
  });

  // KEWAJIBAN JANGKA PENDEK (Current Liabilities)
  const utangDagangAccount = await prisma.account.upsert({
    where: { number: "2101" },
    update: {},
    create: {
      name: "Utang Dagang",
      number: "2101",
      balance: 8000000,
      description: "Utang kepada supplier",
      account_type_id: kewajibanJangkaPendek.id,
      account_category_id: liabilityCategory.id,
      is_active: true,
    },
  });

    const utangGajiAccount = await prisma.account.upsert({
    where: { number: "2201" },
    update: {},
    create: {
      name: "Utang Gaji",
      number: "2201",
      balance: 5000000,
      description: "Gaji karyawan yang belum dibayar",
      account_type_id: kewajibanJangkaPendek.id,
      account_category_id: liabilityCategory.id,
      is_active: true,
    },
  });

  // KEWAJIBAN JANGKA PANJANG (Long-term Liabilities)
  const utangBankAccount = await prisma.account.upsert({
    where: { number: "2301" },
    update: {},
    create: {
      name: "Utang Bank",
      number: "2301",
      balance: 50000000,
      description: "Pinjaman bank jangka panjang",
      account_type_id: kewajibanJangkaPanjang.id,
      account_category_id: liabilityCategory.id,
      is_active: true,
    },
  });

  // EKUITAS (Equity)
  const modalAccount = await prisma.account.upsert({
    where: { number: "3101" },
    update: {},
    create: {
      name: "Modal Pemilik",
      number: "3101",
      balance: 200000000,
      description: "Modal awal pemilik",
      account_type_id: ekuitas.id,
      account_category_id: equityCategory.id,
      is_active: true,
    },
  });

  const labaAccount = await prisma.account.upsert({
    where: { number: "3201" },
    update: {},
    create: {
      name: "Laba Ditahan",
      number: "3201",
      balance: 0,
      description: "Akumulasi laba yang tidak dibagikan",
      account_type_id: ekuitas.id,
      account_category_id: equityCategory.id,
      is_active: true,
    },
  });

  // PENDAPATAN (Revenue)
  const penjualanAccount = await prisma.account.upsert({
    where: { number: "4101" },
    update: {},
    create: {
      name: "Penjualan Corndog",
      number: "4101",
      balance: 0,
      description: "Pendapatan dari penjualan corndog",
      account_type_id: pendapatan.id,
      account_category_id: revenueCategory.id,
      is_active: true,
    },
  });

  const pendapatanLainAccount = await prisma.account.upsert({
    where: { number: "4102" },
    update: {},
    create: {
      name: "Pendapatan Lain-lain",
      number: "4102",
      balance: 0,
      description: "Pendapatan di luar penjualan utama",
      account_type_id: pendapatanNonOperasional.id,
      account_category_id: nonOpexCategory.id,
      is_active: true,
    },
  });

  // HPP (Cost of Goods Sold)
  const hppBahanBakuAccount = await prisma.account.upsert({
    where: { number: "5101" },
    update: {},
    create: {
      name: "HPP - Bahan Baku",
      number: "5101",
      balance: 0,
      description: "Biaya bahan baku corndog yang terjual",
      account_type_id: hargaPokokPenjualan.id,
      account_category_id: cogsCategory.id,
      is_active: true,
    },
  });

  const hppProduksiAccount = await prisma.account.upsert({
    where: { number: "5102" },
    update: {},
    create: {
      name: "HPP - Tenaga Kerja Langsung",
      number: "5102",
      balance: 0,
      description: "Biaya karyawan produksi",
      account_type_id: hargaPokokPenjualan.id,
      account_category_id: cogsCategory.id,
      is_active: true,
    },
  });

  // BEBAN OPERASIONAL - UMUM & ADMIN
  const gajiAdminAccount = await prisma.account.upsert({
    where: { number: "6101" },
    update: {},
    create: {
      name: "Gaji Karyawan Admin",
      number: "6101",
      balance: 0,
      description: "Gaji staff administrasi",
      account_type_id: umumAdmin.id,
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  const sewaBangunanAccount = await prisma.account.upsert({
    where: { number: "6102" },
    update: {},
    create: {
      name: "Sewa Bangunan",
      number: "6102",
      balance: 0,
      description: "Sewa tempat usaha",
      account_type_id: umumAdmin.id,
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  // BEBAN OPERASIONAL - PENJUALAN & OPERASIONAL
  const listrikAirAccount = await prisma.account.upsert({
    where: { number: "6202" },
    update: {},
    create: {
      name: "Listrik & Air",
      number: "6202",
      balance: 0,
      description: "Biaya utilitas bulanan",
      account_type_id: bebanPenjualanOperasional.id,
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  const iklanAccount = await prisma.account.upsert({
    where: { number: "6203" },
    update: {},
    create: {
      name: "Iklan & Promosi",
      number: "6203",
      balance: 0,
      description: "Biaya marketing dan iklan",
      account_type_id: bebanPenjualanOperasional.id,
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  const transportasiAccount = await prisma.account.upsert({
    where: { number: "6204" },
    update: {},
    create: {
      name: "Transportasi & Delivery",
      number: "6204",
      balance: 0,
      description: "Biaya bensin dan ongkos kirim",
      account_type_id: bebanPenjualanOperasional.id,
      account_category_id: opexCategory.id,
      is_active: true,
    },
  });

  // BEBAN NON-OPERASIONAL
  const bungaBankAccount = await prisma.account.upsert({
    where: { number: "7101" },
    update: {},
    create: {
      name: "Bunga Bank",
      number: "7101",
      balance: 0,
      description: "Biaya bunga pinjaman bank",
      account_type_id: bebanNonOperasional.id,
      account_category_id: nonOpexCategory.id,
      is_active: true,
    },
  });

  const kerugianLainAccount = await prisma.account.upsert({
    where: { number: "7201" },
    update: {},
    create: {
      name: "Kerugian Lain-lain",
      number: "7201",
      balance: 0,
      description: "Biaya/kerugian di luar operasional",
      account_type_id: bebanNonOperasional.id,
      account_category_id: nonOpexCategory.id,
      is_active: true,
    },
  });

  const accounts = [
    kasAccount, bankAccount, piutangAccount, persediaanAccount,
    peralatanAccount, kendaraanAccount, akumulasiPenyusutanAccount,
    utangDagangAccount, utangGajiAccount, utangBankAccount,
    modalAccount, labaAccount,
    penjualanAccount, pendapatanLainAccount,
    hppBahanBakuAccount, hppProduksiAccount,
    gajiAdminAccount, sewaBangunanAccount,
    listrikAirAccount, iklanAccount, transportasiAccount,
    bungaBankAccount, kerugianLainAccount,
  ];

  console.log(`✅ Created ${accounts.length} Indonesian COA accounts`);

  // ============================================================================
  // STEP 4: Create Sample Transactions
  // ============================================================================
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const salesAccount = accounts.find(a => a.number === "4101");
  const cashAccountTx = accounts.find(a => a.number === "1101");
  const bankAccountTx = accounts.find(a => a.number === "1102");
  const cogsAccount = accounts.find(a => a.number === "5101");
  const utilitiesAccount = accounts.find(a => a.number === "6202");
  const marketingAccount = accounts.find(a => a.number === "6203");

  if (salesAccount && cashAccountTx && bankAccountTx && cogsAccount && utilitiesAccount && marketingAccount) {
    const transactions = await Promise.all([
      // Sales income
      prisma.transaction.create({
        data: {
          account_id: salesAccount.id,
          amount: 5000000,
          transaction_type: "INCOME",
          description: "Penjualan corndog harian - Semua outlet",
          transaction_date: twoDaysAgo,
          reference_number: "INV-20251116-001",
        },
      }),
      prisma.transaction.create({
        data: {
          account_id: salesAccount.id,
          amount: 6500000,
          transaction_type: "INCOME",
          description: "Penjualan corndog harian - Semua outlet",
          transaction_date: yesterday,
          reference_number: "INV-20251117-001",
        },
      }),

      // Cash transactions (Asset category)
      prisma.transaction.create({
        data: {
          account_id: cashAccountTx.id,
          amount: 5000000,
          transaction_type: "INCOME",
          description: "Penerimaan kas dari penjualan",
          transaction_date: twoDaysAgo,
          reference_number: "CASH-20251116-001",
        },
      }),
      prisma.transaction.create({
        data: {
          account_id: cashAccountTx.id,
          amount: 2000000,
          transaction_type: "EXPENSE",
          description: "Pengeluaran kas untuk pembelian bahan baku",
          transaction_date: twoDaysAgo,
          reference_number: "CASH-20251116-002",
        },
      }),

      // Bank transactions (Asset category)
      prisma.transaction.create({
        data: {
          account_id: bankAccountTx.id,
          amount: 6500000,
          transaction_type: "INCOME",
          description: "Transfer dari penjualan online",
          transaction_date: yesterday,
          reference_number: "BANK-20251117-001",
        },
      }),
      prisma.transaction.create({
        data: {
          account_id: bankAccountTx.id,
          amount: 1500000,
          transaction_type: "EXPENSE",
          description: "Pembayaran listrik dan air via transfer",
          transaction_date: yesterday,
          reference_number: "BANK-20251117-002",
        },
      }),

      // COGS
      prisma.transaction.create({
        data: {
          account_id: cogsAccount.id,
          amount: 2000000,
          transaction_type: "EXPENSE",
          description: "Pembelian bahan baku corndog",
          transaction_date: twoDaysAgo,
          reference_number: "PO-20251116-001",
        },
      }),

      // Operational Expenses
      prisma.transaction.create({
        data: {
          account_id: utilitiesAccount.id,
          amount: 1500000,
          transaction_type: "EXPENSE",
          description: "Pembayaran listrik dan air - November 2025",
          transaction_date: yesterday,
          reference_number: "UTIL-202511-001",
        },
      }),
      prisma.transaction.create({
        data: {
          account_id: marketingAccount.id,
          amount: 3000000,
          transaction_type: "EXPENSE",
          description: "Biaya iklan social media",
          transaction_date: twoDaysAgo,
          reference_number: "MKT-202511-001",
        },
      }),
    ]);

    console.log(`✅ Created ${transactions.length} sample transactions (including Asset category transactions)`);
  }

  console.log("\n✅ Finance module seeding completed!");
  console.log("📊 Summary:");
  console.log(`   - 7 Account Categories`);
  console.log(`   - 11 Account Types`);
  console.log(`   - ${accounts.length} Accounts`);
  console.log(`   - 9 Sample Transactions (covering Asset, Revenue, COGS, and Operational categories)\n`);
}

// If running directly (not imported)
if (require.main === module) {
  seedFinance()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
