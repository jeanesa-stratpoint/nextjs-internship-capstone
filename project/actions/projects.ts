"use server";

import { db } from "@/lib/db";
import { projects, projectMembers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// 1. Added memberIds as a parameter
export async function createProjectAction(
  name: string,
  description: string,
  dueDate: string | null,
  memberIds: string[] = [] // Default to an empty array
) {
  try {
    const { userId } = await auth();

    if (!userId) return { success: false, error: "Unauthorized: You must be logged in." };
    if (!name.trim()) return { success: false, error: "Project name is required." };

    // 2. Insert the project
    const [newProject] = await db
      .insert(projects)
      .values({
        name: name,
        description: description,
        ownerId: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    // 3. Prepare the array of members to insert (Owner + Invited Members)
    // We map over the memberIds and set their role to "member"
    const membersToInsert = [
      { projectId: newProject.id, userId: userId, role: "owner" },
      ...memberIds.map((id) => ({ projectId: newProject.id, userId: id, role: "member" })),
    ];

    // 4. Batch insert all members at once!
    await db.insert(projectMembers).values(membersToInsert);

    revalidatePath("/projects");
    return { success: true, project: newProject };
  } catch (error: unknown) {
    console.error("Failed to create project:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create project.";
    return { success: false, error: errorMessage };
  }
}
