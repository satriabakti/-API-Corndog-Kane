/* eslint-disable @typescript-eslint/no-empty-object-type */
import { TProduct } from "../entities/product/product";
import Repository from "./Repository";

export interface ProductRepository extends Repository<TProduct> {}