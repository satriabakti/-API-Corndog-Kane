import express from 'express';
import { MasterProductController } from '../../controllers/MasterProductController';
import { validate } from '../../validations/validate.middleware';
import { 
  productInventoryCreateSchema, 
  productInventoryUpdateSchema 
} from '../../validations/productInventory.validation';
import { getPaginationSchema } from '../../validations/pagination.validation';

const router = express.Router();

const masterProductController = new MasterProductController();

// Get all master products with pagination
router.get('/', validate(getPaginationSchema), masterProductController.getAllMasterProducts);

// Get product inventory for a master product
router.get('/:id/inventory', masterProductController.getProductInventory);

// Create or update product inventory
router.post('/inventory', validate(productInventoryCreateSchema), masterProductController.createProductInventory);
router.put('/inventory/:id', validate(productInventoryUpdateSchema), masterProductController.updateProductInventory);

export default router;