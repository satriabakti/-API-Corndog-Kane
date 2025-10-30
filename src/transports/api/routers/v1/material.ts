import express from 'express';
import { MaterialController } from '../../controllers';
import { validate } from '../../validations/validate.middleware';
import { stockInSchema, stockOutSchema } from '../../validations/material.validation';
import MaterialService from '../../../../core/services/MaterialService';
import MaterialRepository from '../../../../adapters/postgres/repositories/MaterialRepository';
import { MaterialResponseMapper } from "../../../../mappers/response-mappers";
import { getPaginationSchema } from '../../validations/pagination.validation';

const router = express.Router();

const materialController = new MaterialController();
const materialService = new MaterialService(new MaterialRepository());

// GET inventory list
router.get(
	"/",
	validate(getPaginationSchema),
	materialController.findAll(materialService, MaterialResponseMapper)
);

// POST stock in
router.post(
	"/in",
	validate(stockInSchema),
	materialController.stockIn()
);

// POST stock out
router.post(
	"/out",
	validate(stockOutSchema),
	materialController.stockOut()
);

// GET buy list
router.get(
	"/buy",
	validate(getPaginationSchema),
	materialController.getBuyList()
);

// GET stocks inventory
router.get(
	"/stocks",
	validate(getPaginationSchema),
	materialController.getStocksList()
);

export default router;