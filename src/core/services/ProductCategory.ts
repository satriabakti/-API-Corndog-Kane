import { TCategory, TCategoryWithID } from "../entities/product/category";
import { ProductCategoryRepository } from "../repositories/productcategory";
import { Service } from "./Service";

export default class ProductCategoryService extends Service<TCategory | TCategoryWithID> {
	declare repository: ProductCategoryRepository;

	constructor(repository: ProductCategoryRepository) {
		super(repository);
	}
}
