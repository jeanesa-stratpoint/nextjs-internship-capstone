"use server";

import { db } from "@/lib/db";
import { lists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";

export async function updateListOrderAction(projectId: string, listUpdates: { id: string; order: number }[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "task:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    await Promise.all(
      listUpdates.map((list) =>
        db.update(lists).set({ order: list.order }).where(eq(lists.id, list.id))
      )
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder lists:", error);
    return { success: false, error: "Failed to reorder columns." };
  }
}