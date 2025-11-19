import { EntityMapConfig } from "../adapters/postgres/repositories/Repository";
import { UserMapperEntity } from "./mappers/UserMapperEntity";
import { RoleMapperEntity } from "./mappers/RoleMapperEntity";
import { OutletMapperEntity } from "./mappers/OutletMapperEntity";
import { LoginMapperEntity } from "./mappers/LoginMapperEntity";
import { ProductMapperEntity } from "./mappers/ProductMapperEntity";
import { EmployeeMapperEntity } from "./mappers/EmployeeMapperEntity";
import { OutletAssignmentMapperEntity } from "./mappers/OutletAssignmentMapperEntity";
import { ProductCategoryMapperEntity } from "./mappers/ProductCategoryMapper";
import { SupplierMapperEntity } from "./mappers/SupplierMapperEntity";
import { MaterialMapperEntity } from "./mappers/MaterialMapperEntity";
import { OutletProductRequestMapperEntity } from "./mappers/OutletProductRequestMapperEntity";
import { OutletMaterialRequestMapperEntity } from "./mappers/OutletMaterialRequestMapperEntity";
import { OrderMapperEntity } from "./mappers/OrderMapperEntity";
import { ProductMasterMapperEntity } from "./mappers/ProductMasterEntity";
import { PayrollMapperEntity } from "./mappers/PayrollMapperEntity";
import { AccountMapperEntity } from "./mappers/AccountMapperEntity";
import { AccountCategoryMapperEntity } from "./mappers/AccountCategoryMapperEntity";
import { TransactionMapperEntity } from "./mappers/TransactionMapperEntity";

export const EntityMappers: Record<string, EntityMapConfig> = {
	order: OrderMapperEntity,
	material: MaterialMapperEntity,
	user: UserMapperEntity,
	role: RoleMapperEntity,
	outlet: OutletMapperEntity,
	login: LoginMapperEntity,
	product: ProductMapperEntity,
	employee: EmployeeMapperEntity,
	outletEmployee: OutletAssignmentMapperEntity,
	productCategory: ProductCategoryMapperEntity,
	supplier: SupplierMapperEntity,
	outletProductRequest: OutletProductRequestMapperEntity,
	outletMaterialRequest: OutletMaterialRequestMapperEntity,
	payroll: PayrollMapperEntity,
	productMaster: ProductMasterMapperEntity,
	account: AccountMapperEntity,
	accountCategory: AccountCategoryMapperEntity,
	transaction: TransactionMapperEntity,
};

/**
 * Get mapping configuration for an entity
 */
export function getEntityMapper(entityName: string): EntityMapConfig {
  const mapper = EntityMappers[entityName];
  if (!mapper) {
    console.log("Mapper for", entityName, ":", mapper);
    throw new Error(`No mapper configuration found for entity: ${entityName}`);
  }
  return mapper;
}
