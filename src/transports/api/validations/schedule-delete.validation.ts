import { z } from 'zod';

export const deleteScheduleSchema = z.object({
  params: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    outlet_id: z.string().regex(/^\d+$/, "outlet_id must be a number"),
  }),
});
