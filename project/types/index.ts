import { z } from "zod";
import { projects, lists, tasks, users, comments, taskActivities } from "@/lib/db/schema";
import { taskSchema, projectSchema, listSchema, userSchema } from "@/lib/validations";

export type DbUser = typeof users.$inferSelect;
export type DbProject = typeof projects.$inferSelect;
export type DbList = typeof lists.$inferSelect;
export type DbTask = typeof tasks.$inferSelect;
export type DbComment = typeof comments.$inferSelect;
export type DbActivity = typeof taskActivities.$inferSelect;

export type UserPayload = z.input<typeof userSchema>;
export type ProjectPayload = z.input<typeof projectSchema>;
export type ListPayload = z.input<typeof listSchema>;
export type TaskPayload = z.input<typeof taskSchema>;

export interface ProjectWithMetrics {
  project: DbProject;
  role: string;
  metrics: {
    memberCount: number;
    taskCount: number;
    completedTaskCount: number;
    ownerName: string;
    isOwner: boolean;
  };
}

export interface TeamMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl?: string;
}