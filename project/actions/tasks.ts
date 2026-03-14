"use server";

import { db } from "@/lib/db";
import { tasks, lists, users, taskActivities, projects } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { asc, eq, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries/index";

export async function createTaskAction(formData: unknown, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const canCreateTask = await hasSystemPermission(userId, "task:create");
    if (!canCreateTask) {
      return { success: false, error: "Access Denied: Your role cannot create tasks." };
    }

    const validationResult = taskSchema.safeParse(formData);

    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }

    const validatedData = validationResult.data;

    if (validatedData.dueDate) {
      // CHANGED: Using your clean query layer instead of db.select()
      const project = await queries.projects.getById(projectId);
      
      if (project?.dueDate && validatedData.dueDate > project.dueDate) {
        return { success: false, error: "Task due date cannot be later than the project's due date." };
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
    return { success: true, task: newTask };

  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create task. Please check your inputs." };
  }
}

export async function updateTaskStatus(taskId: string, newListId: string, projectId: string) {
  try {

    await db.update(tasks).set({ listId: newListId }).where(eq(tasks.id, taskId));
    
    const projectLists = await db.select()
      .from(lists)
      .where(eq(lists.projectId, projectId))
      .orderBy(asc(lists.order));

    if (projectLists.length === 0) return { success: true };

    const endListId = projectLists[projectLists.length - 1].id;

    const projectTasks = await db.select().from(tasks).where(inArray(tasks.listId, projectLists.map(l => l.id)));

    const allTasksCompleted = projectTasks.length > 0 && projectTasks.every((t) => t.listId === endListId);

    if (allTasksCompleted) {
      await db.update(projects).set({ isArchived: true }).where(eq(projects.id, projectId));
    } else {
      await db.update(projects).set({ isArchived: false }).where(eq(projects.id, projectId));
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, isArchived: allTasksCompleted };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { success: false, error: "Failed to move task." };
  }
}

export async function updateTaskAction(
  taskId: string,
  projectId: string,
  data: {
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    dueDate?: string | null;
    assigneeId?: string | null;
    listId: string;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const existingTask = await queries.tasks.getById(taskId);
    if (!existingTask) return { success: false, error: "Task not found." };

    const formattedDueDate = data.dueDate ? new Date(data.dueDate) : null;

    await db.update(tasks).set({
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      dueDate: formattedDueDate,
      assigneeId: data.assigneeId || null,
      listId: data.listId,
    }).where(eq(tasks.id, taskId));

    const newActivities = [];

    if (existingTask.title !== data.title) {
      newActivities.push({ taskId, userId, actionType: "updated", oldValue: "title" });
    }

    if ((existingTask.description || "") !== (data.description || "")) {
      newActivities.push({ taskId, userId, actionType: "updated", oldValue: "description" });
    }

    if (existingTask.priority !== data.priority) {
      newActivities.push({ taskId, userId, actionType: "updated", oldValue: "priority" });
    }

    const oldDateStr = existingTask.dueDate ? existingTask.dueDate.toISOString().split("T")[0] : null;
    const newDateStr = data.dueDate || null;
    if (oldDateStr !== newDateStr) {
      newActivities.push({ taskId, userId, actionType: "updated", oldValue: "due date" });
    }

    if (existingTask.listId !== data.listId) {
       const [newList] = await db.select().from(lists).where(eq(lists.id, data.listId)).limit(1);
       if (newList) {
         newActivities.push({ taskId, userId, actionType: "moved", newValue: newList.name });
       }
    }

    if ((existingTask.assigneeId || null) !== (data.assigneeId || null)) {
       let newAssigneeName = "Unassigned";
       if (data.assigneeId) {
         const [assignee] = await db.select().from(users).where(eq(users.id, data.assigneeId)).limit(1);
         if (assignee) {
           newAssigneeName = `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email;
         }
       }
       newActivities.push({ taskId, userId, actionType: "assigned", newValue: newAssigneeName });
    }

    if (newActivities.length > 0) {
      await db.insert(taskActivities).values(newActivities);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };

  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Failed to update task details." };
  }
}

export async function deleteTaskAction(taskId: string, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await db.delete(tasks).where(eq(tasks.id, taskId));

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete task." };
  }
}

export async function updateTaskOrderAction(projectId: string, taskUpdates: { id: string; order: number; listId: string }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await Promise.all(
      taskUpdates.map((task) =>
        db.update(tasks)
          .set({ order: task.order, listId: task.listId })
          .where(eq(tasks.id, task.id))
      )
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder tasks:", error);
    return { success: false, error: "Failed to reorder tasks." };
  }
}