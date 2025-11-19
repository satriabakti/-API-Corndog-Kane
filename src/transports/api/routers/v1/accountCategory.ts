import express from 'express';
import { AccountCategoryController } from '../../controllers/AccountCategoryController';

const router = express.Router();
const accountCategoryController = new AccountCategoryController();

// GET all account categories
router.get(
  "/",
  accountCategoryController.getAll()
);

export default router;
