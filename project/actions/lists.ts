"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries";

export async function createListAction(projectId: string, name: string, newOrder: number, color: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member." };
    if (!name.trim()) return { success: false, error: "List name is required" };

    const existingLists = await queries.tasks.getListsByProject(projectId);
    if (existingLists.length > 0) {
      const lastList = existingLists[existingLists.length - 1];
      if (lastList.stage === "completed") {
         await queries.lists.updateOrder(lastList.id, existingLists.length);
      }
    }

    const newList = await queries.lists.create({
      projectId, name: name.trim(), order: newOrder, color
    });

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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member." };
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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member." };

    await Promise.all(listUpdates.map((list) => queries.lists.updateOrder(list.id, list.order)));

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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member." };

    await queries.lists.delete(listId);

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
    if (!canEdit) return { success: false, error: "Access Denied" };const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) return { success: false, error: "Access Denied: You must be a project member." };

    await queries.tasks.deleteAllInList(listId);

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear tasks:", error);
    return { success: false, error: "Failed to clear tasks." };
  }
}