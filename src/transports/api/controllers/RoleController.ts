import RoleRepository from "../../../adapters/postgres/repositories/RoleRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TRoleGetResponse } from "../../../core/entities/user/role";
import RoleService from '../../../core/services/RoleService';
import Controller from "./Controller";

export class RoleController extends Controller<TRoleGetResponse, TMetadataResponse> {
  private roleService: RoleService;

  constructor() {
    super();
    this.roleService = new RoleService(new RoleRepository());
  }

  // The findAll method is inherited from the parent Controller class
  // It can be called from routes as: roleController.findAll(roleService, RoleResponseMapper)
}