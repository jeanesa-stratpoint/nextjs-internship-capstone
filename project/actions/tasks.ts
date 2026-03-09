"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";import { auth } from "@clerk/nextjs/server";
import { hasSystemPermission } from "@/lib/rbac";

export async function createTaskAction(formData: unknown, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { 
        success: false, 
        error: "Unauthorized: You must be logged in." 
      };
    }

    const canCreateTask = await hasSystemPermission(userId, "task:create");
    if (!canCreateTask) {
      return { 
        success: false, 
        error: "Access Denied: Your role cannot create tasks." 
      };
    }

    const validationResult = taskSchema.safeParse(formData);

    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const [newTask] = await db.insert(tasks).values({
        title: validatedData.title,
        description: validatedData.description || null,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate || null,
        listId: validatedData.listId,
        order: 0,
        assigneeId: validatedData.assigneeId || null,
      }).returning();

    revalidatePath(`/projects/${projectId}`);
    return { 
      success: true, 
      task: newTask 
    };

  } catch (error: unknown) {
    console.error("Failed to create task:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create task. Please check your inputs." 
    };
  }
}

export async function updateTaskStatus(taskId: string, newListId: string, projectId: string) {
  try {
    // Update the task's listId in the Neon database
    await db.update(tasks).set({ listId: newListId }).where(eq(tasks.id, taskId));

    // Clear the Next.js cache so the board stays perfectly in sync
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { success: false, error: "Failed to move task." };
  }
}
