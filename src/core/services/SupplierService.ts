import SupplierRepository from "../../adapters/postgres/repositories/SupplierRepository";
import { TSupplier, TSupplierWithID } from "../entities/suplier/suplier";
import { Service } from "./Service";

export default class SupplierService extends Service<TSupplier | TSupplierWithID> {
	declare repository: SupplierRepository;

	constructor(repository: SupplierRepository) {
		super(repository);
	}
}