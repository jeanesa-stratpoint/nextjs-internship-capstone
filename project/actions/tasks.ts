"use server";

import { taskSchema, type TaskPayload } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries/index";

export async function createTaskAction(formData: unknown, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized: You must be logged in." };

    const canCreateTask = await hasSystemPermission(userId, "task:create");
    if (!canCreateTask) return { success: false, error: "Access Denied: Your role cannot create tasks." };

    const validationResult = taskSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, error: validationResult.error.issues[0].message };

    const validatedData = validationResult.data;

    if (validatedData.dueDate) {
      const project = await queries.projects.getById(projectId);
      if (project?.dueDate && validatedData.dueDate > project.dueDate) {
        return { success: false, error: "Task due date cannot be later than the project's due date." };
      }
    }

    const newTask = await queries.tasks.create({
      title: validatedData.title,
      description: validatedData.description || null,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate || null,
      listId: validatedData.listId,
      order: 0,
      assigneeId: validatedData.assigneeId || null,
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, task: newTask };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create task." };
  }
}

export async function updateTaskStatus(taskId: string, newListId: string, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "task:edit");
    if (!canEdit) return { success: false, error: "Access Denied: You do not have permission to move tasks." };

    const existingTask = await queries.tasks.getById(taskId);
    if (!existingTask) return { success: false, error: "Task not found." };

    await queries.tasks.updateStatus(taskId, newListId);

    if (existingTask.listId !== newListId) {
       const newList = await queries.tasks.getListById(newListId);
       if (newList) {
         await queries.tasks.logActivity({
           taskId, userId, actionType: "moved", newValue: newList.name,
         });
       }
    }

    const projectLists = await queries.tasks.getListsByProject(projectId);
    if (projectLists.length === 0) return { success: true };

    const endListId = projectLists[projectLists.length - 1].id;
    const projectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
    const allTasksCompleted = projectTasks.length > 0 && projectTasks.every((t) => t.listId === endListId);

    await queries.projects.updateArchiveStatus(projectId, allTasksCompleted);

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
  data: TaskPayload
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "task:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    const validationResult = taskSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }

    const validatedData = validationResult.data;

    const existingTask = await queries.tasks.getById(taskId);
    if (!existingTask) return { success: false, error: "Task not found." };

    await queries.tasks.updateDetails(taskId, {
      title: validatedData.title,
      description: validatedData.description || null,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate || null,
      assigneeId: validatedData.assigneeId || null,
      listId: validatedData.listId,
    });

    const newActivities: { taskId: string; userId: string; actionType: string; oldValue?: string; newValue?: string }[] = [];

    if (existingTask.title !== validatedData.title) newActivities.push({ taskId, userId, actionType: "updated", oldValue: "title" });
    if ((existingTask.description || "") !== (validatedData.description || "")) newActivities.push({ taskId, userId, actionType: "updated", oldValue: "description" });
    if (existingTask.priority !== validatedData.priority) newActivities.push({ taskId, userId, actionType: "updated", oldValue: "priority" });

    const oldDateStr = existingTask.dueDate ? existingTask.dueDate.toISOString().split("T")[0] : null;
    const newDateStr = validatedData.dueDate ? validatedData.dueDate.toISOString().split("T")[0] : null;
    if (oldDateStr !== newDateStr) newActivities.push({ taskId, userId, actionType: "updated", oldValue: "due date" });

    if (existingTask.listId !== validatedData.listId) {
       const newList = await queries.tasks.getListById(validatedData.listId);
       if (newList) newActivities.push({ taskId, userId, actionType: "moved", newValue: newList.name });
    }

    if ((existingTask.assigneeId || null) !== (validatedData.assigneeId || null)) {
       let newAssigneeName = "Unassigned";
       if (validatedData.assigneeId) {
         const assignee = await queries.users.getById(validatedData.assigneeId);
         if (assignee) {
           newAssigneeName = `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email;
         }
       }
       newActivities.push({ taskId, userId, actionType: "assigned", newValue: newAssigneeName });
    }

    await queries.tasks.logBulkActivities(newActivities);

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
    const canDelete = await hasSystemPermission(userId, "task:delete"); 
    if (!canDelete) return { success: false, error: "Access Denied: You do not have permission to delete tasks." };

    await queries.tasks.delete(taskId);

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
    if (taskUpdates.length === 0) return { success: true };

    const canEdit = await hasSystemPermission(userId, "task:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    const taskIds = taskUpdates.map(t => t.id);
    const existingTasks = await queries.tasks.getByIds(taskIds);
    const existingMap = new Map(existingTasks.map(t => [t.id, t.listId]));

    const projectLists = await queries.tasks.getListsByProject(projectId);
    const listNameMap = new Map(projectLists.map(l => [l.id, l.name]));

    const newActivities: { taskId: string; userId: string; actionType: string; newValue: string }[] = [];

    await Promise.all(
      taskUpdates.map((taskUpdate) => {
        const oldListId = existingMap.get(taskUpdate.id);
        
        if (oldListId && oldListId !== taskUpdate.listId) {
          const newListName = listNameMap.get(taskUpdate.listId);
          if (newListName) {
            newActivities.push({ taskId: taskUpdate.id, userId, actionType: "moved", newValue: newListName });
          }
        }
        return queries.tasks.updateOrderAndStatus(taskUpdate.id, taskUpdate.order, taskUpdate.listId);
      })
    );

    await queries.tasks.logBulkActivities(newActivities);

    if (projectLists.length > 0) {
      const endListId = projectLists[projectLists.length - 1].id;
      const allProjectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
      const allTasksCompleted = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.listId === endListId);
      
      await queries.projects.updateArchiveStatus(projectId, allTasksCompleted);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder tasks:", error);
    return { success: false, error: "Failed to reorder tasks." };
  }
}