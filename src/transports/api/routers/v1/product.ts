
import express from 'express';
import { validate } from '../../validations/validate.middleware';
import { 
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  productStockInSchema
 } from '../../validations/product.validation';
import { getPaginationSchema } from '../../validations/pagination.validation';
import { ProductController } from '../../controllers/ProductController';
import ProductService from '../../../../core/services/ProductService';
import {ProductRepository} from '../../../../adapters/postgres/repositories/ProductRepository';
import { ProductResponseMapper } from '../../../../mappers/response-mappers/ProductResponseMapper';
import { storage } from '../../../../policies/uploadImages';

const router = express.Router();

const productController = new ProductController();
const productService = new ProductService(new ProductRepository());

router.get(
  "/",
  validate(getPaginationSchema),
  productController.findAll(
    productService,
    ProductResponseMapper
  )
);

// GET stocks inventory
router.get(
  "/stock",
  validate(getPaginationSchema),
  productController.getStocksList()
);

// POST stock in with PRODUCTION source
router.post(
  "/in",
  validate(productStockInSchema),
  productController.addStockIn
);

router.post(
  "/",
  storage('products')('image_path'),
  validate(createProductSchema),
  productController.createProduct
);
router.put('/:id',
  storage('products')('image_path'),
  validate(updateProductSchema),
  productController.updateProduct
);
router.delete(
  "/:id",
  validate(deleteProductSchema),
  productController.deleteProduct
);

// GET detailed product with materials relation
router.get(
  "/:id/detail",
  productController.getDetailedProduct
);

export default router;