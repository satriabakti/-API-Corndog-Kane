import { TEmployee } from "../entities/employee/employee";
import { TAttendanceWithID } from "../entities/employee/attendance";
import Repository from "./Repository";

// Raw attendance data with relations from database - no mapping applied
export type TAttendanceWithRelations = {
  id: number;
  employee: {
    id: number;
    name: string;
    nik: string;
    phone: string;
    address: string;
  };
  outlet: {
    id: number;
    name: string;
    code: string;
    location: string;
  };
  checkin_image_proof: string;
  checkout_image_proof: string | null;
  checkin_time: Date;
  checkout_time: Date | null;
  late_minutes: number;
  late_notes: string | null;
  late_present_proof: string | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeeRepository = Repository<TEmployee> & {
  // Attendance methods
  checkin(employeeId: number, outletId: number, imagePath: string): Promise<TAttendanceWithID>;
  checkout(employeeId: number, imagePath: string): Promise<TAttendanceWithID>;
  findTodayAttendance(employeeId: number): Promise<TAttendanceWithID | null>;
  
  // Find employee scheduled for outlet today
  findScheduledEmployeeByUserId(userId: number): Promise<number | null>;
  
  // Get attendances by outlet with optional date filter
  // Returns raw data - ResponseMapper should be applied in Controller layer
  getAttendancesByOutlet(
    outletId: number, 
    date?: string, 
    page?: number, 
    limit?: number
  ): Promise<{ data: TAttendanceWithRelations[]; total: number }>;

  // Update late approval status
  updateLateApprovalStatus(
    attendanceId: number,
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<TAttendanceWithID>;
} 