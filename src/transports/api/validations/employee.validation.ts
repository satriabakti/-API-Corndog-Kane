import { z } from "zod";
import { MeritalStatus, BloodType, Gender } from "../../../core/entities/employee/employee";

export const createEmployeeSchema = z.object({
  body: z.object({
    nik: z.string().min(16, "NIK must be 16 characters").max(16, "NIK must be 16 characters"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    address: z.string().min(1, "Address is required"),
    province_id: z.string().transform((val) => BigInt(val)),
    city_id: z.string().transform((val) => BigInt(val)),
    district_id: z.string().transform((val) => BigInt(val)),
    subdistrict_id: z.string().transform((val) => BigInt(val)),
    merital_status: z.nativeEnum(MeritalStatus, { message: "Invalid merital status" }),
    religion: z.string().min(1, "Religion is required"),
    birth_date: z.string().transform((val) => new Date(val)),
    birth_place: z.string().min(1, "Birth place is required"),
    blood_type: z.nativeEnum(BloodType, { message: "Invalid blood type" }),
    rt: z.string().min(1, "RT is required"),
    rw: z.string().min(1, "RW is required"),
    work_type: z.string().min(1, "Work type is required"),
    position: z.string().min(1, "Position is required"),
    notes: z.string().optional(),
    gender: z.nativeEnum(Gender, { message: "Invalid gender" }),
    hire_date: z.string().transform((val) => new Date(val)),
    is_active: z.string().optional().transform((val) => val === "true"),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Employee ID is required"),
  }),
  body: z.object({
    nik: z.string().min(16, "NIK must be 16 characters").max(16, "NIK must be 16 characters").optional(),
    name: z.string().min(1, "Name is required").optional(),
    phone: z.string().min(1, "Phone is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    province_id: z.string().optional().transform((val) => val ? BigInt(val) : undefined),
    city_id: z.string().optional().transform((val) => val ? BigInt(val) : undefined),
    district_id: z.string().optional().transform((val) => val ? BigInt(val) : undefined),
    subdistrict_id: z.string().optional().transform((val) => val ? BigInt(val) : undefined),
    merital_status: z.nativeEnum(MeritalStatus, { message: "Invalid merital status" }).optional(),
    religion: z.string().min(1, "Religion is required").optional(),
    birth_date: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    birth_place: z.string().min(1, "Birth place is required").optional(),
    blood_type: z.nativeEnum(BloodType, { message: "Invalid blood type" }).optional(),
    rt: z.string().min(1, "RT is required").optional(),
    rw: z.string().min(1, "RW is required").optional(),
    work_type: z.string().min(1, "Work type is required").optional(),
    position: z.string().min(1, "Position is required").optional(),
    notes: z.string().optional(),
    gender: z.nativeEnum(Gender, { message: "Invalid gender" }).optional(),
    hire_date: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    is_active: z.string().optional().transform((val) => val === "true"),
  }),
});

export const getEmployeeByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Employee ID is required"),
  }),
});

export const deleteEmployeeSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Employee ID is required"),
  }),
});

export const getEmployeesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
    search_key: z.string().optional(),
    search_value: z.string().optional(),
  }),
});

/**
 * Validation schema for employee check-in
 * Note: File validation is handled by multer middleware
 * This validates that the file was uploaded successfully
 */
export const checkinSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
      { message: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." }
    ),
    destination: z.string(),
    filename: z.string().min(1, "Check-in image is required"),
    path: z.string().min(1, "Check-in image path is required"),
    size: z.number().max(5 * 1024 * 1024, "File size must not exceed 5MB"),
  }),
});

/**
 * Validation schema for employee checkout
 * Note: File validation is handled by multer middleware
 * This validates that the file was uploaded successfully
 */
export const checkoutSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
      { message: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." }
    ),
    destination: z.string(),
    filename: z.string().min(1, "Checkout image is required"),
    path: z.string().min(1, "Checkout image path is required"),
    size: z.number().max(5 * 1024 * 1024, "File size must not exceed 5MB"),
  }),
});

/**
 * Validation schema for getting attendances by outlet
 */
export const getAttendancesByOutletSchema = z.object({
  params: z.object({
    outletId: z.string().min(1, "Outlet ID is required"),
  }),
  query: z.object({
    date: z.string().optional().refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: "Date must be in format YYYY-MM-DD" }
    ),
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  }),
});

/**
 * Validation schema for getting schedules with date range filters
 */
export const getSchedulesSchema = z.object({
  query: z.object({
    view: z.string().optional(),
    start_date: z.string().optional().refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: "start_date must be in format YYYY-MM-DD" }
    ),
    end_date: z.string().optional().refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: "end_date must be in format YYYY-MM-DD" }
    ),
    status: z.enum(['PRESENT', 'SICK', 'NOT_PRESENT', 'EXCUSED', 'CUTI']).optional(),
    search_key: z.enum(['employee_name', 'outlet_name', 'attendance_status', 'late_approval_status']).optional(),
    search_value: z.string().optional(),
    page: z.string().optional().refine(
      (val) => !val || /^\d+$/.test(val),
      { message: "page must be a positive number" }
    ),
    limit: z.string().optional().refine(
      (val) => !val || /^\d+$/.test(val),
      { message: "limit must be a positive number" }
    ),
  }),
});

/**
 * Validation schema for updating late approval status
 * PATCH /employees/:id/:status
 */
export const updateLateApprovalStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Attendance ID is required"),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
      message: "Status must be PENDING, APPROVED, or REJECTED"
    }),
  }),
});
