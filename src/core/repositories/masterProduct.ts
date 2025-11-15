import { Repository } from "./Repository";
import { TMasterProduct, TMasterProductWithID } from "../entities/product/masterProduct";

export interface MasterProductRepository extends Repository<TMasterProduct | TMasterProductWithID> {
  // Additional methods specific to MasterProduct if needed
}