/**
 * Financial Statement Service
 * 
 * Generates dynamic financial statements (Laba Rugi, Neraca, Arus Kas)
 * with monthly arrays calculated from transaction data and formula expressions
 */

import { TransactionRepository } from "../../adapters/postgres/repositories/TransactionRepository";
import { AccountRepository } from "../../adapters/postgres/repositories/AccountRepository";
import { 
  TFinancialStatements, 
  SectionResult, 
  ReportPeriod,
  AccountTypeBalance 
} from "../entities/finance/report";
import { financeMapping } from "../../configs/financeMapping";

type MappingType = {
  section: string;
  label: string;
  account_types: string[];
  account_numbers: string[];
  calculation?: string;
  subsections?: MappingType[];
};

export class FinancialStatementService {
  private transactionRepo: TransactionRepository;
  private accountRepo: AccountRepository;

  constructor(
    transactionRepo: TransactionRepository,
    accountRepo: AccountRepository
  ) {
    this.transactionRepo = transactionRepo;
    this.accountRepo = accountRepo;
  }

  /**
   * Generate complete financial statements
   */
  async generateStatements(
    startDate: Date,
    endDate: Date,
    reportCategory: 'laba_rugi' | 'neraca' | 'cashflow' | 'all'
  ): Promise<TFinancialStatements> {
    const months = this.generateMonthRange(startDate, endDate);

    const period: ReportPeriod = {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      months
    };

    const result: TFinancialStatements = { period };

    // Generate Laba Rugi (Income Statement)
    if (reportCategory === 'laba_rugi' || reportCategory === 'all') {
      result.laba_rugi = await this.generateLabaRugi(startDate, endDate, months);
    }

    // Generate Neraca (Balance Sheet)
    if (reportCategory === 'neraca' || reportCategory === 'all') {
      result.neraca = await this.generateNeraca(startDate, endDate, months);
    }

    // Generate Cashflow (Cash Flow Statement)
    if (reportCategory === 'cashflow' || reportCategory === 'all') {
      result.cashflow = await this.generateCashflow(startDate, endDate, months);
    }

    return result;
  }

  /**
   * Generate Laba Rugi (Gross to Net Income Statement)
   */
  private async generateLabaRugi(
    startDate: Date,
    endDate: Date,
    months: string[]
  ): Promise<SectionResult[]> {
    const mapping = (financeMapping as any).gross_to_net as MappingType[];
    const results = await this.processMapping(mapping, startDate, endDate, months);
    // Cleanup all sections after calculations complete
    return results.map(section => this.cleanupSectionResult(section));
  }

  /**
   * Generate Neraca (Balance Sheet)
   */
  private async generateNeraca(
    startDate: Date,
    endDate: Date,
    months: string[]
  ): Promise<SectionResult[]> {
    const mapping = (financeMapping as any).neraca as MappingType[];
    const results = await this.processMapping(mapping, startDate, endDate, months);
    // Cleanup all sections after calculations complete
    return results.map(section => this.cleanupSectionResult(section));
  }

  /**
   * Generate Cashflow (Cash Flow Statement)
   */
  private async generateCashflow(
    startDate: Date,
    endDate: Date,
    months: string[]
  ): Promise<SectionResult[]> {
    const mapping = (financeMapping as any).cashflow as MappingType[];
    
    // First, generate Laba Rugi WITHOUT cleanup to get NetProfitLoss value with section field intact
    const labaRugiMapping = (financeMapping as any).gross_to_net as MappingType[];
    const labaRugiRaw = await this.processMapping(labaRugiMapping, startDate, endDate, months);
    const netProfitLossSection = labaRugiRaw.find(section => section.section === 'net_profit_loss');
    
    // Build initial context with NetProfitLoss from Laba Rugi
    const initialContext: Record<string, number[]> = {};
    if (netProfitLossSection) {
      initialContext['net_profit_loss'] = netProfitLossSection.amount;
    }
    
    // Process cashflow mapping with injected Laba Rugi data
    const results: SectionResult[] = [];
    const dataContext: Record<string, number[]> = { ...initialContext };

    for (const section of mapping) {
      const result = await this.processSection(section, startDate, endDate, months, dataContext);
      results.push(result);
      // Add this section's data to context for next sections
      if (result.section) {
        dataContext[result.section] = result.amount;
      }
    }
    
    // Cleanup all sections after calculations complete
    return results.map(section => this.cleanupSectionResult(section));
  }

  /**
   * Process mapping configuration recursively
   */
  private async processMapping(
    mapping: MappingType[],
    startDate: Date,
    endDate: Date,
    months: string[]
  ): Promise<SectionResult[]> {
    const results: SectionResult[] = [];
    const dataContext: Record<string, number[]> = {};

    for (const section of mapping) {
      const result = await this.processSection(section, startDate, endDate, months, dataContext);
      results.push(result);
      // Add this section's data to context for next sections
      if (result.section) {
        dataContext[result.section] = result.amount;
      }
    }

    return results;
  }

  /**
   * Process a single section (with subsections if present)
   */
  private async processSection(
    section: MappingType,
    startDate: Date,
    endDate: Date,
    months: string[],
    parentContext: Record<string, number[]> = {}
  ): Promise<SectionResult> {
    const result: SectionResult = {
      section: section.section,
      label: section.label,
      amount: [],
      calculation: section.calculation,
      subsections: []
    };

    // Build local context for subsections
    const localContext: Record<string, number[]> = { ...parentContext };

    // Process subsections first (if any)
    if (section.subsections && section.subsections.length > 0) {
      for (const subsection of section.subsections) {
        const subsectionResult = await this.processSection(subsection, startDate, endDate, months, localContext);
        result.subsections!.push(subsectionResult);
        // Add subsection data to local context
        if (subsectionResult.section) {
          localContext[subsectionResult.section] = subsectionResult.amount;
          
          // Special handling for OtherIncomeExpenses subsections
          // Map by label to create other_income and other_expenses variables
          if (subsectionResult.section === 'other_income_expenses') {
            if (subsectionResult.label === 'Pendapatan Lainnya') {
              localContext['other_income'] = subsectionResult.amount;
            } else if (subsectionResult.label === 'Beban Lainnya') {
              localContext['other_expenses'] = subsectionResult.amount;
            }
          }
        }
      }
    }

    // Calculate or fetch values
    if (section.calculation) {
      // Check if this calculation is a simple variable reference that exists in parent context
      // This handles cross-report references (e.g., NetProfitLoss from Laba Rugi to Cashflow)
      const trimmedCalc = section.calculation.trim();
      
      if (parentContext[trimmedCalc] && parentContext[trimmedCalc].length > 0) {
        // This is a simple variable reference that was injected from parent context
        result.amount = parentContext[trimmedCalc];
      } else {
        // This is a formula - evaluate it using local context
        result.amount = await this.calculateFromFormula(
          section.calculation,
          localContext,
          months.length
        );
      }
    } else {
      // Fetch from transactions
      result.amount = await this.fetchFromTransactions(
        section,
        startDate,
        endDate,
        months
      );
    }

    return result;
  }

  /**
   * Clean up section result for API response
   * Removes: section, calculation fields
   * Removes: subsections if empty
   */
  private cleanupSectionResult(section: SectionResult): SectionResult {
    const cleaned: any = {
      label: section.label,
      amount: section.amount
    };

    // Only include subsections if not empty
    if (section.subsections && section.subsections.length > 0) {
      cleaned.subsections = section.subsections.map(sub => this.cleanupSectionResult(sub));
    }

    return cleaned;
  }

  /**
   * Fetch transaction data for a section
   * Returns array with values for each month (1 or 2 values)
   */
  private async fetchFromTransactions(
    section: MappingType,
    startDate: Date,
    endDate: Date,
    months: string[]
  ): Promise<number[]> {
    // Filter out empty strings from account_types
    const accountTypeCodes = (section.account_types || []).filter(type => type !== "");
    const accountNumbers = section.account_numbers || [];

    // If no filters specified, return zeros for each month
    if (accountTypeCodes.length === 0 && accountNumbers.length === 0) {
      return months.map(() => 0);
    }

    // Fetch monthly balances for the entire period
    const balances = await this.transactionRepo.getMonthlyBalancesByAccountTypes(
      startDate,
      endDate,
      accountTypeCodes,
      accountNumbers
    );

    // Calculate totals for each month in the range (1 or 2 months)
    const monthTotals = months.map(() => 0);

    balances.forEach((accountBalance: AccountTypeBalance) => {
      accountBalance.monthly.forEach((monthData) => {
        const monthIndex = months.indexOf(monthData.month);
        if (monthIndex !== -1) {
          monthTotals[monthIndex] += monthData.balance;
        }
      });
    });

    return monthTotals;
  }

  /**
   * Calculate values from formula using data context
   * Returns array with values for each month (1 or 2 elements)
   * Fully dynamic - formulas come from financeMapping.ts config
   */
  private async calculateFromFormula(
    formula: string,
    dataContext: Record<string, number[]>,
    monthCount: number
  ): Promise<number[]> {
    // Dynamic array size based on actual month count (1 or 2)
    const results = new Array(monthCount).fill(0);

    // Evaluate formula for each month dynamically
    for (let i = 0; i < monthCount; i++) {
      results[i] = this.evaluateFormula(formula, dataContext, i);
    }

    return results;
  }

  /**
   * Evaluate a formula expression for a specific month
   * Replaces variables with actual values and calculates result
   */
  private evaluateFormula(
    formula: string,
    data: Record<string, number[]>,
    monthIndex: number
  ): number {
    let expression = formula;

    // Replace each variable with its value for this month
    // Sort by length descending to replace longer variable names first
    // This prevents partial replacements (e.g., "kas" replacing part of "kas_position")
    const variables = Object.keys(data).sort((a, b) => b.length - a.length);
    
    variables.forEach(variable => {
      const value = data[variable][monthIndex] || 0;
      // Wrap negative numbers in parentheses to avoid syntax errors like "5 - -3" becoming "5--3"
      const valueStr = value < 0 ? `(${value})` : String(value);
      // Replace all occurrences of the variable name
      // Use global replace with exact match
      const regex = new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      expression = expression.replace(regex, valueStr);
    });

    // Evaluate the expression
    return this.safeEval(expression);
  }

  /**
   * Safely evaluate a mathematical expression
   * Only allows basic math operators: + - * / ( )
   */
  private safeEval(expression: string): number {
    // Remove whitespace
    const trimmed = expression.replace(/\s/g, '');
    
    // Sanitize: Only allow numbers, operators, parentheses, and decimal points
    const sanitized = trimmed.replace(/[^0-9+\-*/(). ]/g, '');

    // Check if sanitization removed anything (security check)
    if (sanitized !== trimmed) {
      console.warn(`Invalid characters in expression: ${expression}`);
      return 0;
    }

    try {
      // Use Function constructor to evaluate (safer than eval)
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${sanitized}`)();
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
      console.error(`Error evaluating expression: ${expression}`, error);
      return 0;
    }
  }

  /**
   * Generate array of month keys
   * Returns 1 element if same month, 2 elements (first and last) if different months
   * Format: ["2025-01"] or ["2025-01", "2025-12"]
   */
  private generateMonthRange(startDate: Date, endDate: Date): string[] {
    const firstMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    
    // If same month, return single element
    if (firstMonth === lastMonth) {
      return [firstMonth];
    }
    
    // Return first and last month
    return [firstMonth, lastMonth];
  }
}
