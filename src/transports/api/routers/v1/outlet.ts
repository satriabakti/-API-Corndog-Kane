
import express from 'express';
import { validate } from '../../validations/validate.middleware';
import {
	createOutletSchema,
	deleteOutletSchema,
	getOutletByIdSchema,
	updateOutletSchema,
} from "../../validations/outlet.validation";
import { assignEmployeeToOutletSchema } from "../../validations/outlet-assignment.validation";
import { outletSummarizeSchema } from "../../validations/outlet-summarize.validation";
import { OutletController } from '../../controllers/OutletController';
import OutletService from '../../../../core/services/OutletService';
import OutletRepository from '../../../../adapters/postgres/repositories/OutletRepository';
import { getPaginationSchema } from '../../validations/pagination.validation';

const router = express.Router();

const outletController = new OutletController();
const outletService = new OutletService(new OutletRepository());

router.get('/', validate(getPaginationSchema), outletController.getAllOutlets);
router.get('/:id',
validate(getOutletByIdSchema),
outletController.findById.bind(outletController)
);
router.post(
	"/",
	validate(createOutletSchema),
	outletController.createOutlet
);
router.put(
	"/:id",
	validate(updateOutletSchema),
	outletController.updateOutlet
	)
router.delete(
	"/:id",
	validate(deleteOutletSchema),
	outletController.delete(outletService, "User deleted successfully")
);

// Assign employee to outlet
router.post(
	"/:id/employee/:employeeid",
	validate(assignEmployeeToOutletSchema),
	outletController.assignEmployeeToOutlet
);

// Get outlet product stock movements
router.get(
	"/:id/stocks/products",
	outletController.getOutletProductStocks
);

// Get outlet material stock movements
router.get(
	"/:id/stocks/materials",
	outletController.getOutletMaterialStocks
);

// Get outlet financial summary
router.get(
	"/:id/stocks/summarize",
	validate(outletSummarizeSchema),
	outletController.getSummarize
);

export default router;
