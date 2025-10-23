import { TCategory, TCategoryWithID } from "../../../core/entities/product/category";
import { ProductCategoryRepository as IProductCategory } from "../../../core/repositories/productcategory";
import Repository from "./Repository";

export default class ProductCategoryRepository
	extends Repository<TCategory | TCategoryWithID>
	implements IProductCategory
{
	constructor() {
		super("productCategory");
	}
}
