"use server";

import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await queries.notifications.markAsRead(notificationId, userId);
    
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to update notification." };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await queries.notifications.markAllAsRead(userId);
    
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false, error: "Failed to update notifications." };
  }
}

export async function resolveProjectInviteAction(
  notificationId: string, 
  invitationId: string, 
  status: "accepted" | "declined"
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const invite = await queries.projects.getInvitationById(invitationId);

    if (!invite) return { success: false, error: "Invitation not found." };

    if (invite.status !== "pending") {
      return { 
        success: false, 
        error: "This invitation is no longer valid or has been revoked." 
      };
    }

    await queries.notifications.resolveProjectInvite(
      notificationId, 
      invitationId, 
      status, 
      userId, 
      invite.projectId,
      invite.email
    );

    revalidatePath("/notifications");
    revalidatePath("/projects");
    revalidatePath("/team"); 
    
    return { success: true };
  } catch (error) {
    console.error("Failed to resolve project invite:", error);
    return { success: false, error: "Failed to process invitation." };
  }
}

export async function markNotificationAsUnreadAction(notificationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await queries.notifications.markAsUnread(notificationId, userId);
    
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as unread:", error);
    return { success: false, error: "Failed to update notification." };
  }
}