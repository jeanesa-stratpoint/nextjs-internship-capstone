"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/validations";
import { queries } from "@/lib/db/queries";

export async function createEventAction(formData: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized: You must be logged in." };

    const validationResult = eventSchema.safeParse(formData);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }

    const validatedData = validationResult.data;

    const localRole = await queries.projects.getMemberRole(validatedData.projectId, userId);
    if (!localRole) {
      return { success: false, error: "Access Denied: You must be a project member to schedule events." };
    }

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
    await queries.projects.touchActivity(project.id);
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

    const validationResult = eventSchema.safeParse(formData);
    if (!validationResult.success) return { success: false, error: validationResult.error.issues[0].message };

    const validatedData = validationResult.data;

    const localRole = await queries.projects.getMemberRole(validatedData.projectId, userId);
    if (!localRole) {
      return { success: false, error: "Access Denied: You must be a project member to edit events." };
    }

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

    await queries.projects.touchActivity(project.id);
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

    const localRole = await queries.projects.getMemberRole(projectId, userId);
    if (!localRole) {
      return { success: false, error: "Access Denied: You must be a project member to delete events." };
    }

    await queries.events.delete(eventId);
    await queries.projects.touchActivity(projectId);
    
    revalidatePath("/calendar");
    revalidatePath(`/projects/${projectId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { success: false, error: "Failed to delete event." };
  }
}