
import express from 'express';
import { validate } from '../../validations/validate.middleware';
import { 
  createProductCategorySchema,
  updateProductCategorySchema,
  deleteProductCategorySchema
 } from '../../validations/product.category.validation';
import { getPaginationSchema } from '../../validations/pagination.validation';
import { ProductCategoryController } from '../../controllers/ProductCategory';
import ProductCategoryService from '../../../../core/services/ProductCategory';
import ProductCategoryRepository from '../../../../adapters/postgres/repositories/ProductCategory';
import { ProductCategoryResponseMapper } from '../../../../mappers/response-mappers/ProductCategoryResponseMapper';

const router = express.Router();

const productCategoryController = new ProductCategoryController();
const productCategoryService = new ProductCategoryService(new ProductCategoryRepository());

router.get(
	"/",
	validate(getPaginationSchema),
	productCategoryController.findAll(
		productCategoryService,
		ProductCategoryResponseMapper
	)
);
router.post(
	"/",
	validate(createProductCategorySchema),
	productCategoryController.create(
		productCategoryService,
		ProductCategoryResponseMapper,
		"Product Category created successfully"
	)
);
router.put('/:id',
  validate(updateProductCategorySchema),
  productCategoryController.update(
    productCategoryService,
    ProductCategoryResponseMapper,
    'Product Category updated successfully'
  ));
router.delete(
	"/:id",
	validate(deleteProductCategorySchema),
	productCategoryController.delete(
		productCategoryService,
		"Product Category deleted successfully"
	)
);

export default router;