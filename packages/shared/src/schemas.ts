import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Todo schemas
export const TodoPrioritySchema = z.enum(['high', 'medium', 'low']);
export const TodoStatusSchema = z.enum(['pending', 'in-progress', 'completed']);

export const TodoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: TodoPrioritySchema,
  status: TodoStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: TodoPrioritySchema.default('medium'),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: TodoPrioritySchema.optional(),
  status: TodoStatusSchema.optional(),
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

// Filter schemas
export const TodoFilterSchema = z.object({
  status: TodoStatusSchema.optional(),
  priority: TodoPrioritySchema.optional(),
  search: z.string().optional(),
});

// API Response schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z
    .object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
});