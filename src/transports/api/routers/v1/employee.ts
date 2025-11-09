import express from 'express';
import { validate } from '../../validations/validate.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeByIdSchema,
  deleteEmployeeSchema,
  getEmployeesSchema,
  getAttendancesByOutletSchema,
} from '../../validations/employee.validation';
import { EmployeeController } from '../../controllers/EmployeeController';
import EmployeeService from '../../../../core/services/EmployeeService';
import EmployeeRepository from '../../../../adapters/postgres/repositories/EmployeeRepository';
import { EmployeeResponseMapper } from '../../../../mappers/response-mappers/EmployeeResponseMapper';
import { authMiddleware } from '../../../../policies/authMiddleware';
import { storage, storageMultiple } from '../../../../policies/uploadImages';

const router = express.Router();

const employeeController = new EmployeeController();
const employeeService = new EmployeeService(new EmployeeRepository());

// Upload middleware for attendance images
const uploadAttendanceImage = storage('absent');
const uploadMultipleAttendanceImages = storageMultiple('absent');

router.get('/', validate(getEmployeesSchema), employeeController.findAll(employeeService, EmployeeResponseMapper));
// IMPORTANT: /schedule must come BEFORE /:id to avoid route conflicts
router.get('/schedule', (req, res) => employeeController.getSchedules(req, res, employeeService));

// Get attendances by outlet (must be before /:id route)
router.get('/schedule/:outletId', 
  authMiddleware,
  validate(getAttendancesByOutletSchema),
  (req, res) => employeeController.getAttendancesByOutlet(req, res, employeeService)
);

// Attendance endpoints
router.post('/checkin', 
  authMiddleware, 
  uploadMultipleAttendanceImages([
    { name: 'image_proof', maxCount: 1 },
    { name: 'late_present_proof', maxCount: 1 }
  ]), 
  (req, res) => employeeController.checkin(req, res, employeeService)
);
router.post('/checkout', 
  authMiddleware, 
  uploadAttendanceImage('image_proof'), 
  (req, res) => employeeController.checkout(req, res, employeeService)
);

router.get('/:id', validate(getEmployeeByIdSchema), (req, res) => employeeController.findById(req, res, employeeService));
router.post('/', validate(createEmployeeSchema), employeeController.create(employeeService, EmployeeResponseMapper, 'Employee created successfully'));
router.put('/:id', validate(updateEmployeeSchema), employeeController.update(employeeService, EmployeeResponseMapper, 'Employee updated successfully'));
router.delete('/:id', validate(deleteEmployeeSchema), employeeController.delete(employeeService, 'Employee deleted successfully'));

export default router;
