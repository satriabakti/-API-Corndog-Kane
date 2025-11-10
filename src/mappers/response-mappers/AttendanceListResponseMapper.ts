import { TAttendanceListResponse } from "../../core/entities/employee/attendance";

export class AttendanceListResponseMapper {
  /**
   * Map Prisma attendance with relations to API response format
   */
  static toResponse(attendance: {
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
  }): TAttendanceListResponse {
    return {
      id: attendance.id,
      employee: {
        id: attendance.employee.id,
        name: attendance.employee.name,
        nik: attendance.employee.nik,
        phone: attendance.employee.phone,
        address: attendance.employee.address,
      },
      outlet: {
        id: attendance.outlet.id,
        name: attendance.outlet.name,
        code: attendance.outlet.code,
        location: attendance.outlet.location,
      },
      checkin_image_proof: attendance.checkin_image_proof,
      checkout_image_proof: attendance.checkout_image_proof,
      checkin_time: attendance.checkin_time,
      checkout_time: attendance.checkout_time,
      late_minutes: attendance.late_minutes,
      late_notes: attendance.late_notes,
      late_present_proof: attendance.late_present_proof,
      is_active: attendance.is_active,
      created_at: attendance.createdAt,
      updated_at: attendance.updatedAt,
    };
  }

  /**
   * Map array of attendances to response format
   */
  static toListResponse(attendances: Array<{
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
  }>): TAttendanceListResponse[] {
    return attendances.map(attendance => this.toResponse(attendance));
  }
}
