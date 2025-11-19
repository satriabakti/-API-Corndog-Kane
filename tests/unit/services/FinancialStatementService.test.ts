import { FinancialStatementService } from '../../../src/core/services/FinancialStatementService';
import { TransactionRepository } from '../../../src/adapters/postgres/repositories/TransactionRepository';
import { AccountRepository } from '../../../src/adapters/postgres/repositories/AccountRepository';

describe('FinancialStatementService', () => {
  let service: FinancialStatementService;
  let transactionRepo: jest.Mocked<TransactionRepository>;
  let accountRepo: jest.Mocked<AccountRepository>;

  beforeEach(() => {
    transactionRepo = {
      getMonthlyBalancesByAccountTypes: jest.fn(),
    } as any;

    accountRepo = {
      findByAccountNumbers: jest.fn(),
    } as any;

    service = new FinancialStatementService(transactionRepo, accountRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate statements with correct period', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-02-28');

    transactionRepo.getMonthlyBalancesByAccountTypes.mockResolvedValue([]);

    const result = await service.generateStatements(startDate, endDate, 'laba_rugi');

    expect(result).toBeDefined();
    expect(result.period).toBeDefined();
    expect(result.period.months).toEqual(['2025-01', '2025-02']);
    expect(result.period.start_date).toBe('2025-01-01');
    expect(result.period.end_date).toBe('2025-02-28');
  });

  it('should generate laba_rugi when requested', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    transactionRepo.getMonthlyBalancesByAccountTypes.mockResolvedValue([]);

    const result = await service.generateStatements(startDate, endDate, 'laba_rugi');

    expect(result.laba_rugi).toBeDefined();
    expect(Array.isArray(result.laba_rugi)).toBe(true);
  });

  it('should return 1-element arrays when start and end are same month', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    transactionRepo.getMonthlyBalancesByAccountTypes.mockResolvedValue([]);

    const result = await service.generateStatements(startDate, endDate, 'laba_rugi');

    // Verify months array has 1 element
    expect(result.period.months).toEqual(['2025-01']);
    expect(result.period.months.length).toBe(1);

    // Verify all sections have 1-element amount arrays
    result.laba_rugi?.forEach(section => {
      expect(section.amount.length).toBe(1);
      // Check subsections too
      section.subsections?.forEach(sub => {
        expect(sub.amount.length).toBe(1);
      });
    });
  });

  it('should return 2-element arrays when start and end are different months', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-03-31');

    transactionRepo.getMonthlyBalancesByAccountTypes.mockResolvedValue([]);

    const result = await service.generateStatements(startDate, endDate, 'laba_rugi');

    // Verify months array has 2 elements (first and last)
    expect(result.period.months).toEqual(['2025-01', '2025-03']);
    expect(result.period.months.length).toBe(2);

    // Verify all sections have 2-element amount arrays
    result.laba_rugi?.forEach(section => {
      expect(section.amount.length).toBe(2);
      // Check subsections too
      section.subsections?.forEach(sub => {
        expect(sub.amount.length).toBe(2);
      });
    });
  });

  it('should generate neraca when requested', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    transactionRepo.getMonthlyBalancesByAccountTypes.mockResolvedValue([]);

    const result = await service.generateStatements(startDate, endDate, 'neraca');

    expect(result.neraca).toBeDefined();
    expect(Array.isArray(result.neraca)).toBe(true);
  });

  it('should generate both statements when category is all', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    transactionRepo.getMonthlyBalancesByAccountTypes.mockResolvedValue([]);

    const result = await service.generateStatements(startDate, endDate, 'all');

    expect(result.laba_rugi).toBeDefined();
    expect(result.neraca).toBeDefined();
  });
});
