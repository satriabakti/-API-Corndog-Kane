import RoleRepository from "../../adapters/postgres/repositories/RoleRepository";
import { TRole } from "../entities/user/role";
import { Service } from "./Service";

export default class RoleService extends Service<TRole> {
  declare repository: RoleRepository;

  constructor(repository: RoleRepository) {
    super(repository);
  }
  
}