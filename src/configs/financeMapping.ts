type MappingType = {
    section: SectionName ;
    label: string;
    account_types: string[];
    account_numbers: string[];
    calculation?: string;
    subsections?: MappingType[];
    source?: MappingCategory;
    
};
export enum MappingCategory {
    GrossToNet = "gross_to_net",
    Neraca = "neraca",
    Cashflow = "cashflow",
}
enum SectionName {
    NetSales = "net_sales",
    COGS = "cogs",
    GrossProfitLoss = "gross_profit_loss",
    OperatingExpenses = "operating_expenses",
    OperatingProfitLoss = "operating_profit_loss",
    OtherIncomeExpenses = "other_income_expenses",
    NetProfitLoss = "net_profit_loss",
    Assets = "assets",
    Liabilities = "liabilities",
    Equity = "equity",
    SellingExpenses = "selling_expenses",
    GeneralAdminExpenses = "general_admin_expenses",
    CurrentAssets = "current_assets",
    FixedAssets = "fixed_assets",
    CurrentLiabilities = "current_liabilities",
    LongTermLiabilities = "long_term_liabilities",
    ShortTermLiabilities = "short_term_liabilities",
    Kas = "kas",
    Bank = "bank",
    Piutang = "piutang",
    Hutang = "hutang",
    Inventory = "inventory",
    PrePaidExpenses = "prepaid_expenses",
    AssetInventory = "asset_inventory",
    AssetDepreciation = "asset_depreciation",
    LiabilitiesEquity = "liabilities_equity",
    PaidInCapital = "paid_in_capital",
    RetainedEarnings = "retained_earnings",
    
    OperationalActivities = "operational_activities",   
    InvestmentActivities = "investment_activities",
    FinancingActivities = "financing_activities",
    DepreciationExpense = "depreciation_expense",
    DecreaseInventory = "decrease_inventory",
    IncreaseAccountReceivable = "increase_account_receivable",
    PurchaseAssets = "purchase_assets",
    SalesAssets = "sales_assets",
    RepaymentLoans = "repayment_loans",
    CashFromOperational = "cash_from_operational",
    CashFromInvestment = "cash_from_investment",
    CashFromFinancing = "cash_from_financing",
    GrowthInKas = "growth_in_kas",
    KasPositionOnFirstPeriod = "kas_position_on_first_period",
    KasPositionOnLastPeriod = "kas_position_on_last_period"
}


const grossToNetMapping: MappingType[] = [
    {
        section: SectionName.NetSales,
        label: "Penjualan Bersih",
        account_types: [],
        account_numbers: ["4101"]
    },
    {
        section: SectionName.COGS,
        label: "Harga Pokok Penjualan",
        account_types: [],
        account_numbers: ["5101", "5102"]
    },
    {
        section: SectionName.GrossProfitLoss,
        label: "Laba/Rugi Kotor",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.NetSales} - ${SectionName.COGS}`
    },
    {
        section: SectionName.OperatingExpenses,
        label: "Beban Operasional",
        account_types: [],
        account_numbers: [],
        subsections: [
            {
                section: SectionName.SellingExpenses,
                label: "Beban Penjualan",
                account_types: [],
                account_numbers: ["6202", "6203", "6204"]
            },
            {
                section: SectionName.GeneralAdminExpenses,
                label: "Beban Umum & Administrasi",
                account_types: [],
                account_numbers: ["6101", "6102"]
            }
        ],
        calculation: `${SectionName.SellingExpenses} + ${SectionName.GeneralAdminExpenses}`
    },
    {
        section: SectionName.OperatingProfitLoss,
        label: "Laba/Rugi Operasional",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.GrossProfitLoss} - ${SectionName.OperatingExpenses}`
    },
    {
        section: SectionName.OtherIncomeExpenses,
        label: "Pendapatan/Beban Lainnya",
        account_types: [],
        account_numbers: [],
        subsections: [
            {
                section: SectionName.OtherIncomeExpenses,
                label: "Pendapatan Lainnya",
                account_types: [],
                account_numbers: ["4102"]
            },
            {
                section: SectionName.OtherIncomeExpenses,
                label: "Beban Lainnya",
                account_types: [],
                account_numbers: ["7101", "7201"]
            }
        ],
        calculation: `other_income - other_expenses`
    },
    {
        section: SectionName.NetProfitLoss,
        label: "Laba/Rugi Bersih",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.OperatingProfitLoss} + ${SectionName.OtherIncomeExpenses}`
    }
];
const neracaMapping: MappingType[] = [
    {
        "section": SectionName.Assets,
        "label": "Aset",
        "subsections": [
            {
                "section": SectionName.CurrentAssets,
                "label": "Aset Lancar",
                "account_types": [],
                "account_numbers": [],
                subsections: [
                    {
                        "section": SectionName.Kas,
                        "label":"Kas",
                        "account_types":[""],
                        "account_numbers":["1101"],
                    },
                    {
                        "section": SectionName.Bank,
                        "label":"Bank",
                        "account_types":[""],
                        "account_numbers":["1102"],
                    },
                    {
                        "section": SectionName.Piutang,
                        "label":"Piutang Lain-lain",
                        "account_types":[""],
                        "account_numbers":["1104"],
                    },
                    {
                        "section": SectionName.Inventory,
                        "label":"Persediaan",
                        "account_types":[""],
                        "account_numbers":["1106"],
                    },
                    {
                        "section": SectionName.PrePaidExpenses,
                        "label":"Biaya Dibayar Dimuka",
                        "account_types":[""],
                        "account_numbers":[],
                    }
                ],
                calculation:`${SectionName.Kas} + ${SectionName.Bank} + ${SectionName.Piutang} + ${SectionName.Inventory} + ${SectionName.PrePaidExpenses}`

            },
            {
                "section": SectionName.FixedAssets,
                "label": "Aset Tidak Lancar",
                "account_types": [],
                "account_numbers": [],
                subsections: [
                    {
                        "section": SectionName.AssetInventory,
                        "label":"Inventaris",
                        "account_types":[""],
                        "account_numbers": ["1201", "1202"],
                    },
                    {
                        "section": SectionName.AssetDepreciation,
                        "label":"Akumulasi Penyusutan Aset Tetap",
                        "account_types":[""],
                        "account_numbers": ["1203"],
                    },
                    
                ],
                calculation:`${SectionName.AssetInventory} - ${SectionName.AssetDepreciation}`
            }
        ],
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.CurrentAssets} + ${SectionName.FixedAssets}`
    },
    {
        "section": SectionName.LiabilitiesEquity,
        "label": "Kewajiban dan Ekuitas",
        "subsections": [
            {
                "section": SectionName.ShortTermLiabilities,
                "label": "Kewajiban Jangka Pendek",
                "account_types": [],
                "account_numbers": [],
                subsections: [
                    {
                        "section": SectionName.Hutang,
                        "label":"Hutang Usaha",
                        "account_types":[""],
                        "account_numbers":["2101"],
                    }
                ],
                calculation:`${SectionName.Hutang}`

            },
            {
                "section": SectionName.Equity,
                "label": "Ekuitas",
                "account_types": [],
                "account_numbers": [],
                subsections: [
                    {
                        "section": SectionName.PaidInCapital,
                        "label":"Modal Disetor",
                        "account_types":[""],
                        "account_numbers":["3101"],
                    },
                    {
                        "section": SectionName.RetainedEarnings,
                        "label":"Laba Ditahan",
                        "account_types":[""],
                        "account_numbers":["3201"],
                    }
                ],
                calculation:`${SectionName.PaidInCapital} + ${SectionName.RetainedEarnings}`   

                
            },

        ],
        "account_types": [],
        "account_numbers": [],
        "calculation": `${SectionName.ShortTermLiabilities} + ${SectionName.Equity}`
    }
]


const cashflowMapping: MappingType[] = [
    // 1. LABA BERSIH - Input dari Laporan Laba Rugi
    // This references the NetProfitLoss from Laba Rugi report
    {
        section: SectionName.NetProfitLoss,
        label: "Laba/Rugi Bersih",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.NetProfitLoss}`, // Will be injected from Laba Rugi
        source: MappingCategory.GrossToNet
    },
    
    // 2. AKTIVITAS OPERASIONAL
    {
        section: SectionName.OperationalActivities,
        label: "Aktivitas Operasional",
        account_types: [],
        account_numbers: [],
        subsections: [
            {
                section: SectionName.DepreciationExpense,
                label: "Biaya Penyusutan",
                account_types: [],
                account_numbers: ["1403"]  // Akumulasi Penyusutan
            },
            {
                section: SectionName.DecreaseInventory,
                label: "Penurunan Persediaan",
                account_types: [],
                account_numbers: ["1106"]  // Persediaan Bahan Baku
            },
            {
                section: SectionName.IncreaseAccountReceivable,
                label: "Kenaikan Piutang Usaha",
                account_types: [],
                account_numbers: ["1104"]  // Piutang Dagang
            }
        ],
        calculation: `${SectionName.NetProfitLoss} + ${SectionName.DepreciationExpense} + ${SectionName.DecreaseInventory} - ${SectionName.IncreaseAccountReceivable}`
    },
    
    // 2a. KAS UNTUK AKTIVITAS OPERASIONAL (Subtotal)
    {
        section: SectionName.CashFromOperational,
        label: "Kas Untuk Aktivitas Operasional",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.OperationalActivities}`
    },
    
    // 3. AKTIVITAS INVESTASI
    {
        section: SectionName.InvestmentActivities,
        label: "Aktivitas Investasi",
        account_types: [],
        account_numbers: [],
        subsections: [
            {
                section: SectionName.PurchaseAssets,
                label: "Pembelian Aktiva",
                account_types: ["ASSET_FIXED"],
                account_numbers: []
            },
            {
                section: SectionName.SalesAssets,
                label: "Penjualan Aktiva",
                account_types: [],
                account_numbers: []
            }
        ],
        calculation: `- ${SectionName.PurchaseAssets} + ${SectionName.SalesAssets}`
    },
    
    // 3a. KAS UNTUK AKTIVITAS INVESTASI (Subtotal)
    {
        section: SectionName.CashFromInvestment,
        label: "Kas Untuk Aktivitas Investasi",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.InvestmentActivities}`
    },
    
    // 4. AKTIVITAS PENDANAAN
    {
        section: SectionName.FinancingActivities,
        label: "Aktivitas Pendanaan",
        account_types: [],
        account_numbers: [],
        subsections: [
            {
                section: SectionName.RepaymentLoans,
                label: "Penurunan Pinjaman",
                account_types: [],
                account_numbers: ["2301"]  // Utang Bank
            }
        ],
        calculation: `- ${SectionName.RepaymentLoans}`
    },
    
    // 4a. KAS UNTUK AKTIVITAS PENDANAAN (Subtotal)
    {
        section: SectionName.CashFromFinancing,
        label: "Kas Untuk Aktivitas Pendanaan",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.FinancingActivities}`
    },
    
    // 5. KENAIKAN KAS (Total dari 3 aktivitas)
    {
        section: SectionName.GrowthInKas,
        label: "Kenaikan Kas",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.OperationalActivities} + ${SectionName.InvestmentActivities} + ${SectionName.FinancingActivities}`
    },
    
    // 6. POSISI KAS PERIODE AWAL (Kas + Bank dari Neraca)
    {
        section: SectionName.KasPositionOnFirstPeriod,
        label: "Posisi Kas Periode Awal",
        account_types: [],
        account_numbers: ["1101", "1102"],  // Kas + Bank
    },
    
    // 7. POSISI KAS PERIODE AKHIR
    {
        section: SectionName.KasPositionOnLastPeriod,
        label: "Posisi Kas Periode Akhir",
        account_types: [],
        account_numbers: [],
        calculation: `${SectionName.KasPositionOnFirstPeriod} + ${SectionName.GrowthInKas}`
    }
];
export const financeMapping: Record<MappingCategory, MappingType[]> = {
    [MappingCategory.GrossToNet]: grossToNetMapping,
    [MappingCategory.Neraca]: neracaMapping,
    [MappingCategory.Cashflow]: cashflowMapping,
};
