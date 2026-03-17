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
  dueDate: z.coerce.date().min(new Date(new Date().setHours(0,0,0,0)), "Project due date cannot be in the past.").optional(),
  status: z.enum(["active", "completed", "on-hold"]).optional(),
});

// TASK VALIDATION
export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  contentHtml: z.string().optional().nullable(),
  attachmentUrl: z.string().url("Invalid attachment URL").optional().nullable(),
  priority: z.enum(["low", "medium", "high"], {
    message: "Please select a valid priority level (low, medium, or high)",
  }),
  dueDate: z.preprocess((val) => (val === "" || val === null ? undefined : val), 
    z.coerce.date().min(new Date(new Date().setHours(0,0,0,0)), "Due date cannot be in the past").optional()
  ),
  listId: z.string().uuid("Invalid List ID"),
  assigneeId: z.string().optional().nullable(), 
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
