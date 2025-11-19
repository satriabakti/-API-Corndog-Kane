import express from 'express';
import { validate } from '../../validations/validate.middleware';
import { 
  createTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
  getTransactionByIdSchema,
  generateReportSchema
} from '../../validations/transaction.validation';
import { TransactionController } from '../../controllers/TransactionController';

const router = express.Router();
const transactionController = new TransactionController();

// GET all transactions
router.get(
  "/",
  transactionController.getAll()
);

// GET transaction by ID
router.get(
  "/:id",
  validate(getTransactionByIdSchema),
  transactionController.getById()
);

// POST create transaction
router.post(
  "/",
  validate(createTransactionSchema),
  transactionController.create()
);

// PUT update transaction
router.put(
  "/:id",
  validate(updateTransactionSchema),
  transactionController.update()
);

// DELETE transaction
router.delete(
  "/:id",
  validate(deleteTransactionSchema),
  transactionController.delete()
);

export default router;
