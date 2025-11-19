import express from 'express';
import { AccountTypeController } from '../../controllers/AccountTypeController';
import { getPaginationSchema } from '../../validations/pagination.validation';
import { validate } from '../../validations/validate.middleware';

const router = express.Router();
const accountTypeController = new AccountTypeController();

// GET all account types with pagination
router.get(
  "/",
  validate(getPaginationSchema),
  accountTypeController.getAll()
);

// GET account type by ID
router.get(
  "/:id",
  accountTypeController.getById()
);

export default router;
