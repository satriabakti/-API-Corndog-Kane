import Repository  from "./Repository";
import { TMasterProduct, TMasterProductWithID } from "../entities/product/masterProduct";

export type MasterProductRepository = Repository<TMasterProduct | TMasterProductWithID>