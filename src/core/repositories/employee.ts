import { TEmployee } from "../entities/employee/employee";
import Repository from "./Repository";

export interface EmployeeRepository extends Repository<TEmployee> {
} 