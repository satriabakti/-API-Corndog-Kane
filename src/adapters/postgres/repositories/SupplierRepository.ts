import { TSupplier, TSupplierWithID } from "../../../core/entities/suplier/suplier";
import { SupplierRepository as ISupplierRepository } from "../../../core/repositories/supplier";
import Repository from "./Repository";

export default class SupplierRepository
	extends Repository<TSupplier | TSupplierWithID>
	implements ISupplierRepository
{
	constructor() {
		super("supplier");
	}
}