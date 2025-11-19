import express from 'express';
import { AccountTypeController } from '../../controllers/AccountTypeController';

const router = express.Router();
const accountTypeController = new AccountTypeController();

// GET all account types
router.get(
  "/",
  accountTypeController.getAll()
);

// GET account type by ID
router.get(
  "/:id",
  accountTypeController.getById()
);

export default router;
