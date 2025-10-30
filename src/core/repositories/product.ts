import { TProduct } from "../entities/product/product";
import Repository from "./Repository";
import { ProductStockInEntity, ProductWithStocks } from "../entities/inventory/inventory";

export interface ProductRepository extends Repository<TProduct> {
	createStockIn(data: ProductStockInEntity): Promise<{ id: number; date: Date }>;
	getProductWithStocks(productId: number): Promise<ProductWithStocks | null>;
}