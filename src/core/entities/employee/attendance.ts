/**
 * Attendance Domain Types
 * Entity types for employee check-in/check-out functionality
 */

// ============================================================================
// BASE TYPES - Foundation for attendance domain
// ============================================================================

/**
 * TAttendance - Base type for attendance domain
 */
export type TAttendance = {
  employeeId: number;
  outletId: number;
  checkinImageProof: string;
  checkoutImageProof?: string | null;
  checkinTime: Date;
  checkoutTime?: Date | null;
  lateMinutes?: number;
  lateNotes?: string | null;
  latePresentProof?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Derived types
export type TAttendanceWithID = TAttendance & { id: number };
export type TAttendanceCreate = Omit<TAttendance, 'createdAt' | 'updatedAt'>;

// ============================================================================
// API REQUEST TYPES (snake_case for API contract)
// ============================================================================

/**
 * Request type for check-in
 * Employee ID and Outlet ID come from JWT token
 * Image is uploaded via multipart/form-data
 */
export type TAttendanceCheckinRequest = {
  checkin_image_proof: string; // File path after upload
}

/**
 * Request type for updating late approval status
 * PATCH /employees/:id/:status
 */
export type TAttendanceUpdateLateApprovalRequest = {
  id: number;
  late_approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Request type for check-out
 * Updates today's attendance record
 * Image is uploaded via multipart/form-data
 */
export type TAttendanceCheckoutRequest = {
  checkout_image_proof: string; // File path after upload
}

// ============================================================================
// API RESPONSE TYPES (snake_case for API contract)
// ============================================================================

/**
 * Response type for attendance endpoints
 */
export type TAttendanceGetResponse = Omit<TAttendanceWithID, 'isActive' | 'createdAt' | 'updatedAt' | 'employeeId' | 'outletId' | 'checkinImageProof' | 'checkoutImageProof' | 'checkinTime' | 'checkoutTime' | 'lateMinutes' | 'lateNotes' | 'latePresentProof'> & {
  employee_id: number;
  outlet_id: number;
  checkin_image_proof: string;
  checkout_image_proof: string | null;
  checkin_time: Date;
  checkout_time: Date | null;
  late_minutes: number;
  late_notes: string | null;
  late_present_proof: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

/**
 * Response type for attendance list with employee and outlet details
 */
export type TAttendanceListResponse = {
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
  created_at: Date;
  updated_at: Date;
};

/**
 * Response type for attendance table view
 * Simplified format for table display with attendance status
 */
export type TAttendanceTableResponse = {
  id: number;
  employee_name: string;
  employee_image_path: string; // Added: employee image path
  outlet_name: string; // Added: outlet name
  date: Date;
  checkin_time: Date | null;
  checkin_proof: string | null;
  checkout_time: Date | null;
  checkout_proof: string | null;
  attendance_status: string;
  late_minutes: number;
  late_present_proof: string | null;
  late_notes: string | null;
  late_approval_status: string;
};
