"use server";

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createProjectAction(name: string, description: string) {
  try {
    // 1. Authenticate the user securely
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in.",
      };
    }

    if (!name.trim()) {
      return {
        success: false,
        error: "Project name is required.",
      };
    }

    // 2. Insert into the Neon Database using your exact schema fields
    const newProject = await db
      .insert(projects)
      .values({
        name: name,
        description: description,
        ownerId: userId, // FIXED: Changed 'userId' to 'ownerId'
        // FIXED: Removed 'status' since it doesn't exist in your schema yet
      })
      .returning();

    // 3. Refresh the projects page cache
    revalidatePath("/projects");

    return {
      success: true,
      project: newProject[0],
    };
  } catch (error: unknown) {
    console.error("Failed to create project:", error);
    // Safely check if the error is a standard Error object
    const errorMessage = error instanceof Error ? error.message : "Failed to create project.";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
