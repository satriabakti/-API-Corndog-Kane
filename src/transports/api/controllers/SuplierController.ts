import { TMetadataResponse } from "../../../core/entities/base/response";
import { TSupplierGetResponse } from "../../../core/entities/suplier/suplier";
import SupplierService from '../../../core/services/SupplierService';
import SupplierRepository from "../../../adapters/postgres/repositories/SupplierRepository";
import Controller from "./Controller";

export class SupplierController extends Controller<TSupplierGetResponse, TMetadataResponse> {
  private supplierService: SupplierService;

  constructor() {
    super();
    this.supplierService = new SupplierService(new SupplierRepository());
  }

}