import express from 'express';
import { MasterProductController } from '../../controllers/MasterProductController';
import MasterProductService from '../../../../core/services/MasterProductService';
import { MasterProductRepository } from '../../../../adapters/postgres/repositories/MasterProductRepository';
import { validate } from '../../validations/validate.middleware';
import { 
  productInventoryCreateSchema, 
  productInventoryUpdateSchema 
} from '../../validations/productInventory.validation';

const router = express.Router();

const masterProductController = new MasterProductController();

// Get all master products
router.get('/', masterProductController.getAllMasterProducts);

// Get product inventory for a master product
router.get('/:id/inventory', masterProductController.getProductInventory);

// Create or update product inventory
router.post('/:id/inventory', validate(productInventoryCreateSchema), masterProductController.createProductInventory);
router.put('/:id/inventory/:materialId', validate(productInventoryUpdateSchema), masterProductController.updateProductInventory);

export default router;