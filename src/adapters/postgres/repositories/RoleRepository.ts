import { TRole } from "../../../core/entities/user/role";
import { RoleService as IRoleRepository } from "../../../core/repositories/role";
import Repository from "./Repository";

export default class RoleRepository extends Repository<TRole> implements IRoleRepository {
  constructor() {
    super("role");
  }
  
}