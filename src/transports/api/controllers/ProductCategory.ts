import ProductCategoryRepository from "../../../adapters/postgres/repositories/ProductCategory";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TCategoryGetResponse } from "../../../core/entities/product/category";
import ProductCategoryService from "../../../core/services/ProductCategory";
import Controller from "./Controller";

export class ProductCategoryController extends Controller<TCategoryGetResponse, TMetadataResponse> {
  private productCategoryService: ProductCategoryService;

  constructor() {
    super();
    this.productCategoryService = new ProductCategoryService(new ProductCategoryRepository());
  }

}