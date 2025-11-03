import EmployeeRepository from "../../adapters/postgres/repositories/EmployeeRepository";
import { TEmployee } from "../entities/employee/employee";
import { Service } from "./Service";

export default class EmployeeService extends Service<TEmployee> {
  declare repository: EmployeeRepository;

  constructor(repository: EmployeeRepository) {
    super(repository);
  }

  async getSchedules() {
    return await this.repository.getSchedules();
  }
}
