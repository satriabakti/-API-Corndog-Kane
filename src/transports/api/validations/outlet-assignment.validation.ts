import { z } from "zod";

export const assignEmployeeToOutletSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Outlet ID is required"),
    employeeid: z.string().min(1, "Employee ID is required"),
  }),
  body: z.object({
    date: z.string().transform((val) => new Date(val)),
    is_for_one_week: z.boolean().optional().default(false),
    is_for_one_month: z.boolean().optional().default(false),
    notes: z.string().optional(),
    previous_status: z.enum(['SICK', 'PRESENT', 'NOT_PRESENT', 'EXCUSED', 'CUTI']).optional(),
  }),
});
