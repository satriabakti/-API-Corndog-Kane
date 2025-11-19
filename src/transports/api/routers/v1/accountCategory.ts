import express from 'express';
import { AccountCategoryController } from '../../controllers/AccountCategoryController';
import { getPaginationSchema } from '../../validations/pagination.validation';
import { validate } from '../../validations/validate.middleware';

const router = express.Router();
const accountCategoryController = new AccountCategoryController();

// GET all account categories with pagination
router.get(
  "/",
  validate(getPaginationSchema),
  accountCategoryController.getAll()
);

export default router;
