import EmployeeRepository from "../../adapters/postgres/repositories/EmployeeRepository";
import { TEmployee } from "../entities/employee/employee";
import { TAttendanceWithID } from "../entities/employee/attendance";
import { TAttendanceWithRelations } from "../repositories/employee";
import { Service } from "./Service";

export default class EmployeeService extends Service<TEmployee> {
  declare repository: EmployeeRepository;

  constructor(repository: EmployeeRepository) {
    super(repository);
  }

  async getSchedules(view?: string, startDate?: string, endDate?: string) {
    return await this.repository.getSchedules(view, startDate, endDate);
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
    
    console.log(`Current time: ${currentHour}:${currentMinute} (${currentTimeInMinutes} minutes)`);
    console.log(`Outlet checkout time: ${outletHour}:${outletMinute} (${outletTimeInMinutes} minutes)`);
    
    if (currentTimeInMinutes < outletTimeInMinutes) {
      const formattedOutletTime = `${String(outletHour).padStart(2, '0')}:${String(outletMinute).padStart(2, '0')}`;
      const formattedCurrentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      throw new Error(`Cannot checkout before ${formattedOutletTime}. Current time is ${formattedCurrentTime}.`);
    }

    return await this.repository.checkout(employeeId, imagePath);
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
}
