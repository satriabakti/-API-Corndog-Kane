import { TProduct, TProductWithID } from "../../../core/entities/product/product";
import { ProductRepository as IProductRepository } from "../../../core/repositories/product";
import Repository from "./Repository";

export  class ProductRepository
	extends Repository<TProduct | TProductWithID>
	implements IProductRepository
{
	constructor() {
		super("product");
	}
}
