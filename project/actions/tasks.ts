"use server";

import { taskSchema, commentSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries/index";
import { TaskPayload } from "@/types/index";
import { UTApi } from "uploadthing/server";
import { pusherServer } from "@/lib/pusher";

const utapi = new UTApi();

export async function createTaskAction(formData: unknown, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized: You must be logged in." };

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member to create tasks." };

    const validationResult = taskSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, error: validationResult.error.issues[0].message };

    const validatedData = validationResult.data;

    if (validatedData.dueDate) {
      const project = await queries.projects.getById(projectId);
      if (project?.dueDate && validatedData.dueDate > project.dueDate) {
        return { success: false, error: "Task due date cannot be later than the project's due date." };
      }
    }

    const existingTasksInList = await queries.tasks.getByListIds([validatedData.listId]);
    
    const maxOrder = existingTasksInList.length > 0 
      ? Math.max(...existingTasksInList.map(t => t.order)) 
      : -1;
      
    const newOrder = maxOrder + 1;

    const newTask = await queries.tasks.create({
      title: validatedData.title,
      description: validatedData.description || null,
      contentHtml: validatedData.contentHtml || null, 
      attachmentUrl: validatedData.attachmentUrl || null,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate || null,
      listId: validatedData.listId,
      order: newOrder,
      assigneeId: validatedData.assigneeId || null,
    });

    if (validatedData.assigneeId && validatedData.assigneeId !== userId) {
      const newNotif = await queries.notifications.create({
        userId: validatedData.assigneeId,
        actorId: userId,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `You have been assigned to the task "${newTask.title}".`,
        actionUrl: `/projects/${projectId}` 
      });

      await pusherServer.trigger(`user-${validatedData.assigneeId}`, "new-notification", { id: newNotif.id });
    }

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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member to create tasks." };
    const existingTask = await queries.tasks.getById(taskId);
    if (!existingTask) return { success: false, error: "Task not found." };

    await queries.tasks.updateStatus(taskId, newListId);

    if (existingTask.listId !== newListId) {
       const oldList = await queries.tasks.getListById(existingTask.listId);
       const newList = await queries.tasks.getListById(newListId);
       
       if (oldList && newList) {
         const activity = await queries.tasks.logActivity({
           taskId, userId, actionType: "moved", 
           oldValue: oldList.name, newValue: newList.name,
         });
         await pusherServer.trigger(`task-${taskId}`, "new-activity", [activity]);
       }
    }

    const projectLists = await queries.tasks.getListsByProject(projectId);
    const endListId = projectLists.length > 0 ? projectLists[projectLists.length - 1].id : null;
    if (endListId) {
      const allProjectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
      const allTasksCompleted = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.listId === endListId);
      
      const project = await queries.projects.getById(projectId);
      if (project?.status === "completed" && !allTasksCompleted) {
        await queries.projects.updateStatus(projectId, "active");
        revalidatePath("/projects");
      }
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member to create tasks." };

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
      contentHtml: validatedData.contentHtml || null,
      attachmentUrl: validatedData.attachmentUrl || null,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate || null,
      assigneeId: validatedData.assigneeId || null,
      listId: validatedData.listId,
    });
    
    if (existingTask.attachmentUrl && existingTask.attachmentUrl !== validatedData.attachmentUrl) {
      await deleteFilesFromUploadThing([existingTask.attachmentUrl]);
    }
    
    const newActivities: { taskId: string; userId: string; actionType: string; oldValue?: string | null; newValue?: string | null }[] = [];

    if (existingTask.priority !== validatedData.priority) {
      newActivities.push({ 
        taskId, userId, 
        actionType: "updated_priority",
        oldValue: existingTask.priority || "none", 
        newValue: validatedData.priority 
      });
    }

    const oldDateStr = existingTask.dueDate ? existingTask.dueDate.toISOString().split("T")[0] : null;
    const newDateStr = validatedData.dueDate ? validatedData.dueDate.toISOString().split("T")[0] : null;
    if (oldDateStr !== newDateStr) {
      newActivities.push({ 
        taskId, userId, 
        actionType: "updated_dueDate", 
        oldValue: oldDateStr || "no date", 
        newValue: newDateStr || "no date" 
      });
    }
    
    if (existingTask.listId !== validatedData.listId) {
       const oldList = await queries.tasks.getListById(existingTask.listId);
       const newList = await queries.tasks.getListById(validatedData.listId);
       if (newList && oldList) {
         newActivities.push({ 
           taskId, userId, 
           actionType: "moved", 
           oldValue: oldList.name,
           newValue: newList.name 
         });
       }
    }

    if ((existingTask.assigneeId || null) !== (validatedData.assigneeId || null)) {
       let oldAssigneeName = "Unassigned";
       let newAssigneeName = "Unassigned";

       if (existingTask.assigneeId) {
         const oldAssignee = await queries.users.getById(existingTask.assigneeId);
         if (oldAssignee) oldAssigneeName = `${oldAssignee.firstName || ""} ${oldAssignee.lastName || ""}`.trim() || oldAssignee.email;
       }
       if (validatedData.assigneeId) {
         const newAssignee = await queries.users.getById(validatedData.assigneeId);
         if (newAssignee) newAssigneeName = `${newAssignee.firstName || ""} ${newAssignee.lastName || ""}`.trim() || newAssignee.email;
         
         if (validatedData.assigneeId !== userId) {
            const newNotif = await queries.notifications.create({
              userId: validatedData.assigneeId,
              actorId: userId,
              type: "task_assigned",
              title: "Task Reassigned",
              message: `You have been assigned to the task "${validatedData.title}".`,
              actionUrl: `/projects/${projectId}`
            });
            await pusherServer.trigger(`user-${validatedData.assigneeId}`, "new-notification", { id: newNotif.id });
         }
       }

       newActivities.push({ 
         taskId, userId, 
         actionType: "assigned", 
         oldValue: oldAssigneeName, 
         newValue: newAssigneeName 
       });
    }

    if (existingTask.title !== validatedData.title) newActivities.push({ taskId, userId, actionType: "updated_title" });
    if ((existingTask.description || "") !== (validatedData.description || "")) newActivities.push({ taskId, userId, actionType: "updated_description" });
    if ((existingTask.attachmentUrl || "") !== (validatedData.attachmentUrl || "")) {
      newActivities.push({ taskId, userId, actionType: "updated_attachment" });
    }

    const loggedActivities = await queries.tasks.logBulkActivities(newActivities);
    if (loggedActivities.length > 0) {
      await pusherServer.trigger(`task-${taskId}`, "new-activity", loggedActivities);
    }

    const projectLists = await queries.tasks.getListsByProject(projectId);
    const endListId = projectLists.length > 0 ? projectLists[projectLists.length - 1].id : null;
    if (endListId) {
      const allProjectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
      const allTasksCompleted = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.listId === endListId);
      
      const project = await queries.projects.getById(projectId);
      if (project?.status === "completed" && !allTasksCompleted) {
        await queries.projects.updateStatus(projectId, "active");
        revalidatePath("/projects");
      }
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
    
    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member to create tasks." };

    const existingTask = await queries.tasks.getById(taskId);
    await queries.tasks.delete(taskId);

    if (existingTask?.attachmentUrl) {
      await deleteFilesFromUploadThing([existingTask.attachmentUrl]);
    }

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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member to create tasks." };

    const taskIds = taskUpdates.map(t => t.id);
    const existingTasks = await queries.tasks.getByIds(taskIds);
    const existingMap = new Map(existingTasks.map(t => [t.id, t.listId]));

    const projectLists = await queries.tasks.getListsByProject(projectId);
    const listNameMap = new Map(projectLists.map(l => [l.id, l.name]));

    const newActivities: { taskId: string; userId: string; actionType: string; oldValue?: string; newValue: string }[] = [];

    await Promise.all(
      taskUpdates.map((taskUpdate) => {
        const oldListId = existingMap.get(taskUpdate.id);
        
        if (oldListId && oldListId !== taskUpdate.listId) {
          const oldListName = listNameMap.get(oldListId);
          const newListName = listNameMap.get(taskUpdate.listId);
          
          if (oldListName && newListName) {
            newActivities.push({ 
              taskId: taskUpdate.id, 
              userId, 
              actionType: "moved", 
              oldValue: oldListName,
              newValue: newListName 
            });
          }
        }
        return queries.tasks.updateOrderAndStatus(taskUpdate.id, taskUpdate.order, taskUpdate.listId);
      })
    );

    const loggedActivities = await queries.tasks.logBulkActivities(newActivities);
    if (loggedActivities.length > 0) {
      const byTask = loggedActivities.reduce((acc, act) => {
        if (!acc[act.taskId]) acc[act.taskId] = [];
        acc[act.taskId].push(act);
        return acc;
      }, {} as Record<string, typeof loggedActivities>);

      for (const tId in byTask) {
        await pusherServer.trigger(`task-${tId}`, "new-activity", byTask[tId]);
      }
    }

    const endListId = projectLists.length > 0 ? projectLists[projectLists.length - 1].id : null;
    if (endListId) {
      const allProjectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
      const allTasksCompleted = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.listId === endListId);
      
      const project = await queries.projects.getById(projectId);
      if (project?.status === "completed" && !allTasksCompleted) {
        await queries.projects.updateStatus(projectId, "active");
        revalidatePath("/projects");
      }
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder tasks:", error);
    return { success: false, error: "Failed to reorder tasks." };
  }
}

export async function createCommentAction(taskId: string, projectId: string, content: string) {
  try {
    const validationResult = commentSchema.safeParse({ content, taskId });
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const projectMembers = await queries.projects.getMembers(projectId);
    const isMember = projectMembers.some((member) => member.id === userId);
    if (!isMember) {
      return { success: false, error: "Forbidden: You are not a member of this project." };
    }

    const newComment = await queries.tasks.createComment(taskId, userId, validationResult.data.content);

    const emailRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const mentionedEmails = [...content.matchAll(emailRegex)].map(m => m[1].toLowerCase());

    if (mentionedEmails.length > 0) {
      for (const email of mentionedEmails) {
        const mentionedUser = await queries.users.getByEmail(email);
        
        if (mentionedUser && mentionedUser.id !== userId) {
          const newNotif = await queries.notifications.create({
            userId: mentionedUser.id,
            actorId: userId,
            type: "mention",
            title: "You were mentioned",
            message: `You were mentioned in a comment.`,
            actionUrl: `/projects/${projectId}`,
            referenceId: taskId 
          });
          await pusherServer.trigger(`user-${mentionedUser.id}`, "new-notification", { id: newNotif.id });
        }
      }
    }

    await pusherServer.trigger(`task-${taskId}`, "new-comment", newComment);
    return { success: true };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to post comment." };
  }
}

async function deleteFilesFromUploadThing(urls: (string | null | undefined)[]) {
  const keys = urls
    .filter((url): url is string => !!url)
    .map((url) => {
      const withoutHash = url.split("#")[0]; 
      const parts = withoutHash.split("/");
      return parts[parts.length - 1]; 
    })
    .filter((key) => !!key);

  if (keys.length > 0) {
    try {
      await utapi.deleteFiles(keys);
      console.log(`Successfully deleted ${keys.length} files from UploadThing`);
    } catch (error) {
      console.error("Failed to delete files from UploadThing:", error);
    }
  }
}