import express from 'express';
import { validate } from '../../validations/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeByIdSchema,
  deleteEmployeeSchema,
  getEmployeesSchema,
} from '../../validations/employee.validation';
import { EmployeeController } from '../../controllers/EmployeeController';
import EmployeeService from '../../../../core/services/EmployeeService';
import EmployeeRepository from '../../../../adapters/postgres/repositories/EmployeeRepository';
import { EmployeeResponseMapper } from '../../../../mappers/response-mappers/EmployeeResponseMapper';

const router = express.Router();

const employeeController = new EmployeeController();
const employeeService = new EmployeeService(new EmployeeRepository());

router.get('/', validate(getEmployeesSchema), employeeController.findAll(employeeService, EmployeeResponseMapper));
// IMPORTANT: /schedule must come BEFORE /:id to avoid route conflicts
router.get('/schedule', (req, res) => employeeController.getSchedules(req, res, employeeService));
router.get('/:id', validate(getEmployeeByIdSchema), (req, res) => employeeController.findById(req, res, employeeService));
router.post('/', validate(createEmployeeSchema), employeeController.create(employeeService, EmployeeResponseMapper, 'Employee created successfully'));
router.put('/:id', validate(updateEmployeeSchema), employeeController.update(employeeService, EmployeeResponseMapper, 'Employee updated successfully'));
router.delete('/:id', validate(deleteEmployeeSchema), employeeController.delete(employeeService, 'Employee deleted successfully'));

export default router;
