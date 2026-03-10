// TODO: Task 3.6 - Set up data validation with Zod schemas

/*
TODO: Implementation Notes for Interns:

1. Install Zod: pnpm add zod
2. Create validation schemas for all forms and API endpoints
3. Add proper error messages
4. Set up client and server-side validation

Example schemas needed:
- Project creation/update
- Task creation/update
- User profile update
- List/column management
- Comment creation

Example structure:
import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  dueDate: z.date().min(new Date(), 'Due date must be in future').optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  assigneeId: z.string().uuid().optional(),
})
*/

// Placeholder exports to prevent import errors
// export const projectSchema = "TODO: Implement project validation schema";
// export const taskSchema = "TODO: Implement task validation schema";
// export const userSchema = "TODO: Implement user validation schema";
// export const listSchema = "TODO: Implement list validation schema";
// export const commentSchema = "TODO: Implement comment validation schema";

import { z } from "zod";

// USER VALIDATION
export const userSchema = z.object({
  firstName: z.string().max(255, "First name cannot exceed 255 characters").optional(),
  lastName: z.string().max(255, "Last name cannot exceed 255 characters").optional(),
  email: z.string().email("Invalid email address"),
});

// PROJECT VALIDATION
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  // z.coerce.date() safely converts HTML date picker strings into native JavaScript Date objects
  dueDate: z.coerce.date().min(new Date(), "Due date must be in the future").optional(),
});

// TASK VALIDATION
export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  priority: z.enum(["low", "medium", "high"], {
    message: "Please select a valid priority level (low, medium, or high)",
  }),
  dueDate: z.coerce.date().min(new Date(new Date().setHours(0,0,0,0)), "Due date cannot be in the past").optional(),
  listId: z.string().uuid("Invalid List ID"),
  assigneeId: z.string().optional(),
});

// LIST (KANBAN COLUMN) VALIDATION
export const listSchema = z.object({
  name: z.string().min(1, "Column name is required").max(50, "Name cannot exceed 50 characters"),
  projectId: z.string().uuid("Invalid Project ID"),
  order: z.number().int().min(0, "Order must be a positive number"),
});

// COMMENT VALIDATION
export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
  taskId: z.string().uuid("Invalid Task ID"),
});
