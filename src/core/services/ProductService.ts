import { TProduct, TProductWithID } from "../entities/product/product";
import { ProductRepository } from "../../adapters/postgres/repositories/ProductRepository";
import { Service } from "./Service";

export default class ProductService extends Service<TProduct | TProductWithID> {
  declare repository: ProductRepository;

  constructor(repository: ProductRepository) {
    super(repository);
  }
}
