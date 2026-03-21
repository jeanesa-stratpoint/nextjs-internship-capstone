"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";
import { eventSchema } from "@/lib/validations";
import { queries } from "@/lib/db/queries";

export async function createEventAction(formData: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized: You must be logged in." };

    const canCreateEvent = await hasSystemPermission(userId, "event:create"); 
    if (!canCreateEvent) return { success: false, error: "Access Denied: Your role cannot create events." };

    const validationResult = eventSchema.safeParse(formData);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }

    const validatedData = validationResult.data;

    const project = await queries.projects.getById(validatedData.projectId);
    if (!project) return { success: false, error: "Project not found." };
    
    if (project.dueDate && validatedData.endTime > project.dueDate) {
      return { 
        success: false, 
        error: "Event end time cannot be scheduled after the project's overall due date." 
      };
    }

    const newEvent = await queries.events.create({
      title: validatedData.title,
      description: validatedData.description || null,
      type: validatedData.type,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      projectId: validatedData.projectId,
      creatorId: userId,
    });

    revalidatePath("/calendar");
    revalidatePath(`/projects/${validatedData.projectId}`);
    
    return { success: true, event: newEvent };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create event." };
  }
}

export async function updateEventDetailsAction(eventId: string, formData: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "event:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    const validationResult = eventSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, error: validationResult.error.issues[0].message };

    const validatedData = validationResult.data;

    const project = await queries.projects.getById(validatedData.projectId);
    if (project?.dueDate && validatedData.endTime > project.dueDate) {
      return { success: false, error: "Event end time cannot be scheduled after the project's overall due date." };
    }

    await queries.events.updateDetails(eventId, {
      title: validatedData.title,
      description: validatedData.description || null,
      type: validatedData.type,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
    });

    revalidatePath("/calendar");
    revalidatePath(`/projects/${validatedData.projectId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event details." };
  }
}

export async function deleteEventAction(eventId: string, projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canDelete = await hasSystemPermission(userId, "event:delete"); 
    if (!canDelete) return { success: false, error: "Access Denied" };

    await queries.events.delete(eventId);

    revalidatePath("/calendar");
    revalidatePath(`/projects/${projectId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { success: false, error: "Failed to delete event." };
  }
}