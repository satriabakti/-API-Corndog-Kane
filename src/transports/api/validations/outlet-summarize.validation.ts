import { z } from 'zod';

export const outletSummarizeSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "id must be a number"),
  }),
  query: z.object({
    start_date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid start_date format",
    }),
    end_date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid end_date format",
    }),
    status: z.string().optional(),
  }).optional(),
});
