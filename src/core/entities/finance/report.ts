/**
 * Financial Statement Report Entity Types
 * 
 * Defines the structure for dynamic financial reports with monthly arrays
 */

/**
 * Monthly balance for a single month
 */
export type MonthlyBalance = {
  month: string; // Format: "YYYY-MM" e.g., "2025-01"
  income: number;
  expense: number;
  balance: number; // income - expense
};

/**
 * Account type balance with monthly breakdown
 */
export type AccountTypeBalance = {
  account_type_code: string; // e.g., "REVENUE", "COGS"
  account_type_name: string;
  monthly: MonthlyBalance[];
};

/**
 * Section result in financial statement
 * Can be a data section (from transactions) or calculated section (from formula)
 */
export type SectionResult = {
  section?: string; // Internal use only - not included in API response
  label: string; // Display label in Indonesian
  amount: number[]; // Array of amounts per month [month1, month2, ...]
  calculation?: string; // Internal use only - not included in API response
  subsections?: SectionResult[]; // Nested subsections (only included if not empty)
};

/**
 * Period information for the report
 */
export type ReportPeriod = {
  start_date: string; // Format: "YYYY-MM-DD"
  end_date: string; // Format: "YYYY-MM-DD"
  months: string[]; // Array of month strings: ["2025-01", "2025-02", ...]
};

/**
 * Complete financial statements response
 */
export type TFinancialStatements = {
  period: ReportPeriod;
  laba_rugi?: SectionResult[]; // Gross to Net Income Statement
  neraca?: SectionResult[]; // Balance Sheet (Assets, Liabilities, Equity)
  cashflow?: SectionResult[]; // Cash Flow Statement
};

/**
 * Transaction aggregation for monthly balance calculation
 */
export type TransactionAggregation = {
  account_type_code: string;
  month: string;
  total_income: number;
  total_expense: number;
};

/**
 * Query parameters for financial report generation
 */
export type TFinancialReportQuery = {
  type: 'json' | 'pdf';
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  report_category: 'laba_rugi' | 'neraca' | 'cashflow' | 'all';
};

/**
 * Financial report response (success case)
 */
export type TFinancialReportResponse = {
  status: 'success';
  message: string;
  data: TFinancialStatements;
};
