import z from "zod";

export const createOutletSchema = z.object({
	body: z.object({
		name: z
			.string()
			.min(3, { message: "Name must be at least 3 characters long" })
			.max(50, { message: "Name must be at most 50 characters long" }),
		location: z
			.string()
			.max(100, {
				message: "Location must be at most 100 characters long",
			}),
		code: z
			.string()
			.max(50, {
				message: "Code must be at most 50 characters long",
			}),
		pic_phone: z
			.string()
			.regex(/^08\d{8,12}$/, {
				message: "PIC Phone must start with 08 and be 10 to 14 digits long",
			}),
		description: z
			.string()
			.max(255, {
				message: "Description must be at most 255 characters long",
			})
			.optional(),
		is_active: z.boolean(),
		setting: z.object({
			checkin_time: z
				.string()
				.regex(/^\d{2}:\d{2}:\d{2}$/, {
					message: "Check-in time must be in HH:MM:SS format",
				}),
			checkout_time: z
				.string()
				.regex(/^\d{2}:\d{2}:\d{2}$/, {
					message: "Check-out time must be in HH:MM:SS format",
				}),
			salary: z
				.string()
				.regex(/^\d+$/, {
					message: "Salary must be a numeric string",
				}),
			income_target: z
				.string()
				.regex(/^\d+$/, {
					message: "Income target must be a numeric string",
				}),
		}),
		user_id: z
			.number()
			.int({ message: "User ID must be an integer" })
			.positive({ message: "User ID must be positive" })
			.optional(),
		user: z
			.object({
				name: z
					.string()
					.min(3, {
						message: "User name must be at least 3 characters long",
					})
					.max(100, {
						message: "User name must be at most 100 characters long",
					}),
				username: z
					.string()
					.min(3, {
						message: "Username must be at least 3 characters long",
					})
					.max(50, {
						message: "Username must be at most 50 characters long",
					})
					.regex(/^[a-zA-Z0-9_-]+$/, {
						message: "Username can only contain letters, numbers, underscores, and hyphens",
					}),
				password: z
					.string()
					.min(8, {
						message: "Password must be at least 8 characters long",
					})
					.max(100, {
						message: "Password must be at most 100 characters long",
					}),
				is_active: z.boolean(),
			})
			.optional(),
	}),
});

export const updateOutletSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name must be at most 50 characters long' })
      .optional(),
    location: z.string()
      .max(100, { message: 'Location must be at most 100 characters long' })
      .optional(),
    code: z.string()
      .max(50, { message: 'Code must be at most 50 characters long' })
      .optional(),
    pic_phone: z.string()
      .regex(/^08\d{8,12}$/, { message: 'PIC Phone must start with 08 and be 10 to 14 digits long' })
      .optional(),
    description: z.string()
      .max(255, { message: 'Description must be at most 255 characters long' })
      .optional(),
    is_active: z.boolean()
      .optional(),
    setting: z.object({
      chekin_time: z.string()
        .regex(/^\d{2}:\d{2}:\d{2}$/, { message: 'Check-in time must be in HH:MM:SS format' })
        .optional(),
      checkout_time: z.string()
        .regex(/^\d{2}:\d{2}:\d{2}$/, { message: 'Check-out time must be in HH:MM:SS format' })
        .optional(),
      salary: z.string()
        .regex(/^\d+$/, { message: 'Salary must be a numeric string' })
        .optional(),
      income_target: z.string()
        .regex(/^\d+$/, { message: 'Income target must be a numeric string' })
        .optional()
    }).optional(),
  })

});

export const deleteOutletSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, { message: 'ID must be a number' })
  })
});

export const getOutletByIdSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, { message: 'ID must be a number' })
  })
});