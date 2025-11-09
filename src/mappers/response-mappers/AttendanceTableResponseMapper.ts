import { TAttendanceTableResponse } from '../../core/entities/employee/attendance';

export class AttendanceTableResponseMapper {
  /**
   * Map Prisma attendance data to table view response format
   */
  static toResponse(attendance: {
    id: number;
    employee: {
      name: string;
    };
    checkin_time: Date;
    checkin_image_proof: string;
    checkout_time: Date | null;
    checkout_image_proof: string | null;
    attendance_status: string;
    late_minutes: number;
    late_present_proof: string | null;
    late_notes: string | null;
    late_approval_status: string;
  }): TAttendanceTableResponse {
    return {
      id: attendance.id,
      employee_name: attendance.employee.name,
      date: attendance.checkin_time,
      checkin_time: attendance.checkin_time,
      checkin_proof: attendance.checkin_image_proof,
      checkout_time: attendance.checkout_time,
      checkout_proof: attendance.checkout_image_proof,
      attendance_status: attendance.attendance_status,
      late_minutes: attendance.late_minutes,
      late_present_proof: attendance.late_present_proof,
      late_notes: attendance.late_notes,
      late_approval_status: attendance.late_approval_status,
    };
  }

  /**
   * Map array of attendances to table view response format
   */
  static toListResponse(attendances: Array<{
    id: number;
    employee: {
      name: string;
    };
    checkin_time: Date;
    checkin_image_proof: string;
    checkout_time: Date | null;
    checkout_image_proof: string | null;
    attendance_status: string;
    late_minutes: number;
    late_present_proof: string | null;
    late_notes: string | null;
    late_approval_status: string;
  }>): TAttendanceTableResponse[] {
    return attendances.map(attendance => this.toResponse(attendance));
  }
}
