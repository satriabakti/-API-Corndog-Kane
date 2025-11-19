import express from 'express';
import { validate } from '../../validations/validate.middleware';
import { generateReportSchema } from '../../validations/transaction.validation';
import { TransactionController } from '../../controllers/TransactionController';

const router = express.Router();
const transactionController = new TransactionController();

// GET /finance/reports - Generate finance report
router.get(
  "/",
  validate(generateReportSchema),
  transactionController.generateReport()
);

export default router;
