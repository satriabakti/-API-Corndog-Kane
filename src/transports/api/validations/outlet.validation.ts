import z from "zod";

// Enum for days validation
const DayEnum = z.enum([
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
]);

// Setting item schema for array
const settingItemSchema = z.object({
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
	salary: z.number().int().positive({
		message: "Salary must be a positive integer",
	}),
	days: z
		.array(DayEnum)
		.min(1, { message: "At least one day must be specified" }),
});

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

		description: z
			.string()
			.max(255, {
				message: "Description must be at most 255 characters long",
			})
			.optional(),
		is_active: z.boolean(),
		income_target: z.number().int().nonnegative({
			message: "Income target must be a non-negative integer",
		}),
		setting: z
			.array(settingItemSchema)
			.min(1, { message: "At least one setting must be provided" }),
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
				role_id: z
					.number()
					.int({ message: "Role ID must be an integer" })
					.positive({ message: "Role ID must be positive" }),
				is_active: z.boolean().default(true),
			})
			.optional(),
	}),
});

// Setting item schema for update (with optional id)
const settingItemUpdateSchema = settingItemSchema.extend({
	id: z.number().int().positive().optional(),
});

export const updateOutletSchema = z.object({
	body: z.object({
		name: z
			.string()
			.min(3, { message: "Name must be at least 3 characters long" })
			.max(50, { message: "Name must be at most 50 characters long" })
			.optional(),
		location: z
			.string()
			.max(100, { message: "Location must be at most 100 characters long" })
			.optional(),
		code: z
			.string()
			.max(50, { message: "Code must be at most 50 characters long" })
			.optional(),
	
		description: z
			.string()
			.max(255, { message: "Description must be at most 255 characters long" })
			.optional(),
		is_active: z.boolean().optional(),
		income_target: z
			.number()
			.int()
			.nonnegative({
				message: "Income target must be a non-negative integer",
			})
			.optional(),
		setting: z.array(settingItemUpdateSchema).optional(),
	}),
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