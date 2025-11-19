import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Finance Reports API', () => {
  let app: any;

  beforeAll(async () => {
    const RestApiTransport = (await import('../../src/transports/api/instance')).default;
    await RestApiTransport.registerAppsUsed();
    app = RestApiTransport.app;

    // Wait for server initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/finance/reports', () => {
    it('should return 400 when type=json but missing required params', async () => {
      const response = await request(app)
        .get('/api/v1/finance/reports')
        .query({ type: 'json' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when end_date is before start_date', async () => {
      const response = await request(app)
        .get('/api/v1/finance/reports')
        .query({
          type: 'json',
          start_date: '2025-03-01',
          end_date: '2025-01-31',
          report_category: 'laba_rugi'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when report_category is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/finance/reports')
        .query({
          type: 'json',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          report_category: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });
});
