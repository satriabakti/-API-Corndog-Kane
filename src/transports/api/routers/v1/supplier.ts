
import express from 'express';
import { SupplierController } from '../../controllers';
import { validate } from '../../validations/validate.middleware';
import { createSupplierSchema,updateSupplierSchema,deleteSupplierSchema } from '../../validations/supplier.validation';
import SupplierService from '../../../../core/services/SupplierService';
import SupplierRepository from '../../../../adapters/postgres/repositories/SupplierRepository';
import { SupplierResponseMapper } from "../../../../mappers/response-mappers";
import { getPaginationSchema } from '../../validations/pagination.validation';

const router = express.Router();

const supplierController = new SupplierController();
const supplierService = new SupplierService(new SupplierRepository());

router.get(
	"/",
	validate(getPaginationSchema),
	supplierController.findAll(supplierService, SupplierResponseMapper)
);
router.post(
	"/",
	validate(createSupplierSchema),
	supplierController.create(
		supplierService,
		SupplierResponseMapper,
		"Supplier created successfully"
	)
);
router.put(
	"/:id",
	validate(updateSupplierSchema),
	supplierController.update(
		supplierService,
		SupplierResponseMapper,
		"Supplier updated successfully"
	)
);
router.delete(
	"/:id",
	validate(deleteSupplierSchema),
	supplierController.delete(supplierService, "Supplier deleted successfully")
);

export default router;