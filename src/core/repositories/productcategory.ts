import { TCategory, TCategoryWithID } from "../entities/product/category";
import Repository from "./Repository";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProductCategoryRepository
	extends Repository<TCategory | TCategoryWithID> {}

