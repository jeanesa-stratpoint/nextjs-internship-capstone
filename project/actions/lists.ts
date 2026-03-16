"use server";

import { db } from "@/lib/db";
import { lists, tasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";

async function syncCompleteStage(projectId: string) {
  const projectLists = await db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.order));
  if (projectLists.length === 0) return;

  const lastListId = projectLists[projectLists.length - 1].id;

  await db.update(lists).set({ isCompleteStage: false }).where(eq(lists.projectId, projectId));
  await db.update(lists).set({ isCompleteStage: true }).where(eq(lists.id, lastListId));
}

export async function createListAction(projectId: string, name: string, newOrder: number, color: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canCreate = await hasSystemPermission(userId, "list:create");
    if (!canCreate) return { success: false, error: "Access Denied" };

    if (!name.trim()) return { success: false, error: "List name is required" };

    const [newList] = await db.insert(lists).values({
      projectId,
      name: name.trim(),
      order: newOrder,
      color: color, 
      isCompleteStage: false, 
    }).returning();

    await syncCompleteStage(projectId);
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

    await db.update(lists).set({ name: name.trim(), color }).where(eq(lists.id, listId));

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update list:", error);
    return { success: false, error: "Failed to update list details." };
  }
}

export async function updateListOrderAction(projectId: string, listUpdates: { id: string; order: number }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "list:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    await Promise.all(
      listUpdates.map((list) =>
        db.update(lists).set({ order: list.order }).where(eq(lists.id, list.id))
      )
    );

    await syncCompleteStage(projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder lists:", error);
    return { success: false, error: "Failed to reorder columns." };
  }
}

export async function deleteListAction(projectId: string, listId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canDeleteList = await hasSystemPermission(userId, "list:delete"); 
    if (!canDeleteList) return { success: false, error: "Access Denied: You do not have permission to delete columns." };

    await db.delete(lists).where(eq(lists.id, listId));

    await syncCompleteStage(projectId); 
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete list:", error);
    return { success: false, error: "Failed to delete column." };
  }
}

export async function clearListTasksAction(projectId: string, listId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "list:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    await db.delete(tasks).where(eq(tasks.listId, listId));

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear tasks:", error);
    return { success: false, error: "Failed to clear tasks." };
  }
}