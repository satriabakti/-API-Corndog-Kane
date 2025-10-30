import { z } from 'zod';

/**
 * User validation schemas using Zod
 */

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  body: z.object({
    name: z.string({
      message: 'Name is required'
    })
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must not exceed 100 characters' }),
    
    username: z.string({
      message: 'Username is required'
    })
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(50, { message: 'Username must not exceed 50 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' }),
    
    password: z.string({
      message: 'Password is required'
    })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must not exceed 100 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }),
    
    role_id: z.number({
      message: 'Role ID is required'
    })
    .int({ message: 'Role ID must be an integer' })
    .positive({ message: 'Role ID must be positive' }),
    
    is_active: z.boolean({
      message: 'Active status is required'
    })
  })
});

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string({
      message: 'User ID is required'
    })
  }),
  body: z.object({
    name: z.string()
      .min(2, { message: 'Name must be at least 2 characters' })
      .max(100, { message: 'Name must not exceed 100 characters' })
      .optional(),
    
    username: z.string()
      .min(3, { message: 'Username must be at least 3 characters' })
      .max(50, { message: 'Username must not exceed 50 characters' })
      .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
      .optional(),
    
    password: z.string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(100, { message: 'Password must not exceed 100 characters' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' })
      .optional(),
    
    role_id: z.number()
      .int({ message: 'Role ID must be an integer' })
      .positive({ message: 'Role ID must be positive' })
      .optional(),
    
    is_active: z.boolean()
      .optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
});

/**
 * Schema for getting a user by ID
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string({
      message: 'User ID is required'
    })
  })
});

/**
 * Schema for deleting a user
 */
export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string({
      message: 'User ID is required'
    })
  })
});


export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
