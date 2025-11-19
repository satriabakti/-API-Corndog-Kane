import { Request, Response } from 'express';
import { TMetadataResponse } from "../../../core/entities/base/response";
import { 
  TTransactionGetResponse, 
  TTransactionCreateRequest, 
  TTransactionUpdateRequest,
  TTransactionWithID,
  TransactionType,
  TFinanceReport
} from "../../../core/entities/finance/transaction";
import { TFinancialStatements } from "../../../core/entities/finance/report";
import TransactionService from '../../../core/services/TransactionService';
import { FinancialStatementService } from '../../../core/services/FinancialStatementService';
import { TransactionRepository } from "../../../adapters/postgres/repositories/TransactionRepository";
import { AccountRepository } from "../../../adapters/postgres/repositories/AccountRepository";
import Controller from "./Controller";
import { TransactionResponseMapper } from "../../../mappers/response-mappers/TransactionResponseMapper";
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class TransactionController extends Controller<TTransactionGetResponse | TFinanceReport | TFinancialStatements, TMetadataResponse> {
  private transactionService: TransactionService;
  private financialStatementService: FinancialStatementService;

  constructor() {
    super();
    const transactionRepo = new TransactionRepository();
    const accountRepo = new AccountRepository();
    
    this.transactionService = new TransactionService(
      transactionRepo,
      accountRepo
    );
    
    this.financialStatementService = new FinancialStatementService(
      transactionRepo,
      accountRepo
    );
  }

  getAll = () => {
    return async (req: Request, res: Response) => {
      try {
        const { page, limit, search_key, search_value, ...filters } = req.query;
        // Use validated defaults from pagination schema (page=1, limit=10)
        const pageNum = page ? parseInt(page as string, 10) : 1;
        const limitNum = limit ? parseInt(limit as string, 10) : 10;
        
        // Build search config
        const search =
          search_key && 
          search_value && 
          search_key !== 'undefined' && 
          search_value !== 'undefined'
            ? [{ field: search_key as string, value: search_value as string }]
            : undefined;
        
        // Get paginated transactions
        const result = await this.transactionService.getAllTransactions(
          pageNum,
          limitNum,
          search,
          filters as Record<string, any>
        );
        
        // Map to response format
        const mappedData = TransactionResponseMapper.toListResponse(result.data);
        
        const metadata: TMetadataResponse = {
          page: result.page,
          limit: result.limit,
          total_records: result.total,
          total_pages: result.totalPages,
        };
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedData,
            metadata,
          },
          "Transactions retrieved successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to retrieve transactions",
          500,
          [] as TTransactionGetResponse[],
          {
            page: 1,
            limit: 10,
            total_records: 0,
            total_pages: 0,
          } as TMetadataResponse
        );
      }
    };
  }

  getById = () => {
    return async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const transaction = await this.transactionService.findById(id);
        
        if (!transaction) {
          return this.handleError(
            res,
            new Error('Transaction not found'),
            "Transaction not found",
            404,
            {} as TTransactionGetResponse,
            {} as TMetadataResponse
          );
        }
        
        const mappedResult = TransactionResponseMapper.toResponse(transaction as TTransactionWithID);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResult,
            metadata: {} as TMetadataResponse,
          },
          "Transaction retrieved successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to retrieve transaction",
          500,
          {} as TTransactionGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  create = () => {
    return async (req: Request, res: Response) => {
      try {
        const data: TTransactionCreateRequest = req.body;
        
        const transaction = await this.transactionService.createTransaction({
          accountId: data.account_id,
          amount: data.amount,
          transactionType: data.transaction_type as TransactionType,
          description: data.description,
          transactionDate: new Date(data.transaction_date),
          referenceNumber: data.reference_number,
        });
        
        const mappedResult = TransactionResponseMapper.toResponse(transaction);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResult,
            metadata: {} as TMetadataResponse,
          },
          "Transaction created successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to create transaction",
          500,
          {} as TTransactionGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  update = () => {
    return async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const data: TTransactionUpdateRequest = req.body;
        
        const transaction = await this.transactionService.updateTransaction(id, {
          ...(data.account_id !== undefined && { accountId: data.account_id }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.transaction_type !== undefined && { transactionType: data.transaction_type as TransactionType }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.transaction_date !== undefined && { transactionDate: new Date(data.transaction_date) }),
          ...(data.reference_number !== undefined && { referenceNumber: data.reference_number }),
        });
        
        const mappedResult = TransactionResponseMapper.toResponse(transaction);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResult,
            metadata: {} as TMetadataResponse,
          },
          "Transaction updated successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to update transaction",
          500,
          {} as TTransactionGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  delete = () => {
    return async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        await this.transactionService.deleteTransaction(id);
        
        return this.getSuccessResponse(
          res,
          {
            data: {} as TTransactionGetResponse,
            metadata: {} as TMetadataResponse,
          },
          "Transaction deleted successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to delete transaction",
          500,
          {} as TTransactionGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  generateReport = () => {
    return async (req: Request, res: Response) => {
      try {
        const type = (req.query.type as string) || 'table';
        const startDate = new Date(req.query.start_date as string);
        const endDate = new Date(req.query.end_date as string);
        const reportCategory = (req.query.report_category as string) || 'all';

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return this.handleError(
            res,
            new Error('Invalid date format'),
            "Invalid start_date or end_date format. Use YYYY-MM-DD",
            400,
            {} as TFinancialStatements,
            {} as TMetadataResponse
          );
        }

        // Validate end date >= start date
        if (endDate < startDate) {
          return this.handleError(
            res,
            new Error('Invalid date range'),
            "end_date must be greater than or equal to start_date",
            400,
            {} as TFinancialStatements,
            {} as TMetadataResponse
          );
        }

        // Validate report category
        if (!['laba_rugi', 'neraca', 'cashflow', 'all'].includes(reportCategory)) {
          return this.handleError(
            res,
            new Error('Invalid report category'),
            "report_category must be: laba_rugi, neraca, cashflow, or all",
            400,
            {} as TFinancialStatements,
            {} as TMetadataResponse
          );
        }

        // Generate dynamic financial statements with monthly arrays
        if (type === 'json') {
          const statements = await this.financialStatementService.generateStatements(
            startDate,
            endDate,
            reportCategory as 'laba_rugi' | 'neraca' | 'cashflow' | 'all'
          );

          return this.getSuccessResponse(
            res,
            {
              data: statements,
              metadata: {} as TMetadataResponse,
            },
            "Financial statements generated successfully"
          );
        }

        // PDF type also returns JSON with dynamic financial statements
        if (type === 'pdf') {
          const statements = await this.financialStatementService.generateStatements(
            startDate,
            endDate,
            reportCategory as 'laba_rugi' | 'neraca' | 'cashflow' | 'all'
          );

          return this.getSuccessResponse(
            res,
            {
              data: statements,
              metadata: {} as TMetadataResponse,
            },
            "Financial statements generated successfully"
          );
        }

        // Legacy report formats (table, xlsx)
        const accountCategoryIds = req.query.account_category_ids 
          ? (req.query.account_category_ids as string).split(',').map(Number)
          : undefined;

        const report = await this.transactionService.generateReport(
          startDate,
          endDate,
          accountCategoryIds
        );

        // Return based on type
        switch (type) {
          case 'table':
            return this.getSuccessResponse(
              res,
              {
                data: report,
                metadata: {} as TMetadataResponse,
              },
              "Finance report generated successfully"
            );

          case 'xlsx':
            return this.generateExcelReport(res, report);

          default:
            return this.handleError(
              res,
              new Error('Invalid report type'),
              "Report type must be: table, xlsx, pdf, or json",
              400,
              {} as TFinanceReport,
              {} as TMetadataResponse
            );
        }
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to generate report",
          500,
          {} as TFinanceReport,
          {} as TMetadataResponse
        );
      }
    };
  }

  private async generateExcelReport(res: Response, report: TFinanceReport) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Finance Report');

    // Add title and period
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'Finance Report';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Period: ${report.period.start_date} to ${report.period.end_date}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Add summary
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Income', report.summary.total_income]);
    worksheet.addRow(['Total Expense', report.summary.total_expense]);
    worksheet.addRow(['Balance', report.summary.balance]);

    // Add transactions header
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Date',
      'Account Name',
      'Account Number',
      'Description',
      'Income',
      'Expense'
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add transaction data
    report.data.forEach(day => {
      day.transactions.forEach(t => {
        worksheet.addRow([
          day.date,
          t.account_name,
          t.account_number,
          t.description || '',
          t.income_amount,
          t.expense_amount
        ]);
      });
      
      // Add daily total
      const totalRow = worksheet.addRow([
        `${day.date} Total`,
        '',
        '',
        '',
        day.total_income,
        day.total_expense
      ]);
      totalRow.font = { bold: true };
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 30 },
      { width: 15 },
      { width: 15 }
    ];

    // Send file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=finance-report-${report.period.start_date}-${report.period.end_date}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  private async generatePDFReport(res: Response, report: TFinanceReport) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=finance-report-${report.period.start_date}-${report.period.end_date}.pdf`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Finance Report', { align: 'center' });
    doc.fontSize(12).text(
      `Period: ${report.period.start_date} to ${report.period.end_date}`,
      { align: 'center' }
    );
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Income: ${report.summary.total_income.toLocaleString()}`);
    doc.text(`Total Expense: ${report.summary.total_expense.toLocaleString()}`);
    doc.text(`Balance: ${report.summary.balance.toLocaleString()}`);
    doc.moveDown();

    // Transactions
    doc.fontSize(14).text('Transactions', { underline: true });
    doc.fontSize(10);

    report.data.forEach(day => {
      doc.fontSize(12).text(`Date: ${day.date}`);
      doc.fontSize(10);
      
      day.transactions.forEach(t => {
        doc.text(
          `${t.account_name} (${t.account_number}) - ${t.description || 'N/A'}`
        );
        doc.text(`  Income: ${t.income_amount.toLocaleString()} | Expense: ${t.expense_amount.toLocaleString()}`);
      });
      
      doc.fontSize(11).text(
        `Day Total - Income: ${day.total_income.toLocaleString()} | Expense: ${day.total_expense.toLocaleString()}`
      );
      doc.moveDown();
    });

    doc.end();
  }
}
