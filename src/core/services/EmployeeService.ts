import EmployeeRepository from "../../adapters/postgres/repositories/EmployeeRepository";
import { TEmployee } from "../entities/employee/employee";
import { TAttendanceWithID } from "../entities/employee/attendance";
import { TAttendanceWithRelations } from "../repositories/employee";
import { Service } from "./Service";
import PayrollService from "./PayrollService";

export default class EmployeeService extends Service<TEmployee> {
  declare repository: EmployeeRepository;
  private payrollService: PayrollService;

  constructor(repository: EmployeeRepository, payrollService: PayrollService) {
    super(repository);
    this.payrollService = payrollService;
  }

  async getSchedules(
    view?: string, 
    startDate?: string, 
    endDate?: string,
    status?: string,
    searchKey?: string,
    searchValue?: string,
    page?: number,
    limit?: number
  ) {
    return await this.repository.getSchedules(view, startDate, endDate, status, searchKey, searchValue, page, limit);
  }

  /**
   * Find employee scheduled for outlet based on user_id
   */
  async findScheduledEmployeeByUserId(userId: number): Promise<number | null> {
    return await this.repository.findScheduledEmployeeByUserId(userId);
  }

  /**
   * Employee check-in
   * No time validation - can check in anytime
   * Automatically calculates late_minutes based on outlet check_in_time
   */
  async checkin(
    employeeId: number, 
    outletId: number, 
    imagePath: string,
    lateNotes?: string,
    latePresentProof?: string
  ): Promise<TAttendanceWithID> {
    return await this.repository.checkin(employeeId, outletId, imagePath, lateNotes, latePresentProof);
  }

  /**
   * Employee checkout
   * Validates checkout time must be >= outlet check_out_time
   */
  async checkout(employeeId: number, outletId: number, imagePath: string, checkoutTime: string): Promise<TAttendanceWithID> {
    // Parse checkout time from outlet settings (format: "HH:MM:SS" or "HH:MM")
    const timeParts = checkoutTime.split(':').map(Number);
    const outletHour = timeParts[0];
    const outletMinute = timeParts[1];
    
    // Get current time in 24-hour format
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Compare times (convert to minutes for easier comparison)
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const outletTimeInMinutes = outletHour * 60 + outletMinute;
    
    if (currentTimeInMinutes < outletTimeInMinutes) {
      const formattedOutletTime = `${String(outletHour).padStart(2, '0')}:${String(outletMinute).padStart(2, '0')}`;
      const formattedCurrentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      throw new Error(`Cannot checkout before ${formattedOutletTime}. Current time is ${formattedCurrentTime}.`);
    }

    const attendance = await this.repository.checkout(employeeId, imagePath);

    // Create payroll after successful checkout
    try {
      await this.payrollService.createPayrollOnCheckout(attendance.id);
      console.log(`Payroll created for attendance ${attendance.id}`);
    } catch (error) {
      console.error(`Failed to create payroll for attendance ${attendance.id}:`, error);
      // Don't throw error - checkout should succeed even if payroll creation fails
    }

    return attendance;
  }

  /**
   * Get attendances by outlet with optional date filter and pagination
   * Returns raw data - ResponseMapper should be applied in Controller layer
   */
  async getAttendancesByOutlet(
    outletId: number,
    date?: string,
    page?: number,
    limit?: number
  ): Promise<{ data: TAttendanceWithRelations[]; total: number }> {
    return await this.repository.getAttendancesByOutlet(outletId, date, page, limit);
  }

  /**
   * Update late approval status for an attendance record
   * PATCH /employees/:id/:status
   */
  async updateLateApprovalStatus(
    attendanceId: number,
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<TAttendanceWithID> {
    return await this.repository.updateLateApprovalStatus(attendanceId, status);
  }
}
