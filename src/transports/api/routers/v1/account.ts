import express from 'express';
import { validate } from '../../validations/validate.middleware';
import { 
  createAccountSchema,
  updateAccountSchema,
  deleteAccountSchema,
  getAccountByIdSchema
} from '../../validations/account.validation';
import { getPaginationSchema } from '../../validations/pagination.validation';
import { AccountController } from '../../controllers/AccountController';

const router = express.Router();
const accountController = new AccountController();

// GET all accounts (with optional category filter)
router.get(
  "/",
  validate(getPaginationSchema),
  accountController.getAll()
);

// GET account by ID
router.get(
  "/:id",
  validate(getAccountByIdSchema),
  accountController.getById()
);

// POST create account
router.post(
  "/",
  validate(createAccountSchema),
  accountController.create()
);

// PUT update account
router.put(
  "/:id",
  validate(updateAccountSchema),
  accountController.update()
);

// DELETE account
router.delete(
  "/:id",
  validate(deleteAccountSchema),
  accountController.delete()
);

export default router;
