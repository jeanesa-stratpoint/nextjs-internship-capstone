"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries";

export async function createListAction(projectId: string, name: string, newOrder: number, color: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canCreate = await hasSystemPermission(userId, "list:create");
    if (!canCreate) return { success: false, error: "Access Denied" };
    if (!name.trim()) return { success: false, error: "List name is required" };

    const newList = await queries.lists.create({
      projectId, name: name.trim(), order: newOrder, color, isCompleteStage: false
    });

    await queries.lists.syncCompleteStage(projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, list: newList };
  } catch (error) {
    console.error("Failed to create list:", error);
    return { success: false, error: "Failed to create list" };
  }
}

export async function updateListDetailsAction(projectId: string, listId: string, name: string, color: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "list:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };
    if (!name.trim()) return { success: false, error: "List name is required" };

    await queries.lists.updateDetails(listId, name.trim(), color);

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update list details:", error);
    return { success: false, error: "Failed to update list details." };
  }
}

export async function updateListOrderAction(projectId: string, listUpdates: { id: string; order: number }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "list:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    await Promise.all(listUpdates.map((list) => queries.lists.updateOrder(list.id, list.order)));

    await queries.lists.syncCompleteStage(projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder columns:", error);
    return { success: false, error: "Failed to reorder columns." };
  }
}

export async function deleteListAction(projectId: string, listId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canDeleteList = await hasSystemPermission(userId, "list:delete"); 
    if (!canDeleteList) return { success: false, error: "Access Denied" };

    await queries.lists.delete(listId);
    await queries.lists.syncCompleteStage(projectId);

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete column:", error);
    return { success: false, error: "Failed to delete column." };
  }
}

export async function clearListTasksAction(projectId: string, listId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "list:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    await queries.tasks.deleteAllInList(listId);

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear tasks:", error);
    return { success: false, error: "Failed to clear tasks." };
  }
}