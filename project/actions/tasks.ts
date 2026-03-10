"use server";

import { db } from "@/lib/db";
import { tasks, lists, projectMembers, users, projects } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";import { auth } from "@clerk/nextjs/server";
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
    if (validatedData.dueDate) {
      const [project] = await db.select({ dueDate: projects.dueDate }).from(projects).where(eq(projects.id, projectId)).limit(1);
      
      if (project?.dueDate && validatedData.dueDate > project.dueDate) {
        return { 
          success: false, 
          error: "Task due date cannot be later than the project's due date." 
        };
      }
    }

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

export async function getTaskDefaultsAction(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Fetch the project to get its due date
    const [project] = await db
      .select({ dueDate: projects.dueDate })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const projectLists = await db
      .select()
      .from(lists)
      .where(eq(lists.projectId, projectId))
      .orderBy(asc(lists.order));
    
    const defaultList = projectLists.find(l => l.name.toLowerCase() === "to do") || projectLists[0];

    const members = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));

    return { 
      success: true, 
      listId: defaultList?.id, 
      team: members,
      projectDueDate: project?.dueDate // <-- Pass this to the frontend!
    };
  } catch (error) {
    console.error(`Failed to fetch task defaults for project ${projectId}:`, error);
    return { success: false, error: "Failed to load project details." };
  }
}