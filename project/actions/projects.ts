"use server";

import { db } from "@/lib/db";
import { projects, projectMembers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";
import { projectSchema } from "@/lib/validations";

export async function createProjectAction(
  name: string, 
  description: string, 
  dueDate: string | null, 
  memberIds: string[] = []
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { 
        success: false, 
        error: "Unauthorized: You must be logged in." 
      };
    }

    const canCreate = await hasSystemPermission(userId, "project:create");
    if (!canCreate) {
      return { 
        success: false, 
        error: "Access Denied: Only authorized users can create projects." 
      };
    }

    const validationResult = projectSchema.safeParse({
      name: name,
      description: description ? description : undefined,
      dueDate: dueDate ? dueDate : undefined,
    });

    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const [newProject] = await db.insert(projects).values({
      name: validatedData.name, 
      description: validatedData.description, 
      ownerId: userId, 
      dueDate: validatedData.dueDate || null,
    }).returning();

    const membersToInsert = [
      { projectId: newProject.id, userId: userId, role: "owner" },
      ...memberIds.map((id) => ({ projectId: newProject.id, userId: id, role: "member" })),
    ];

    await db.insert(projectMembers).values(membersToInsert);
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    
    return { 
      success: true, 
      project: newProject 
    };

  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create project." 
    };
  }
}

export async function inviteMembersAction(projectId: string, memberIds: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) 
      return { 
        success: false, 
        error: "Unauthorized" 
      };

    const canInvite = await hasSystemPermission(userId, "project-invite:create");
    if (!canInvite) return { 
      success: false, 
      error: "Access Denied: You cannot invite members." 
    };

    if (!projectId) 
      return { 
        success: false, 
        error: "Please select a project." 
      };
    if (memberIds.length === 0) 
      return { 
        success: false, 
        error: "Please select at least one user to invite." 
      };

    const membersToInsert = memberIds.map((id) => ({ 
      projectId: projectId, 
      userId: id, 
      role: "member" 
    }));

    await db.insert(projectMembers)
      .values(membersToInsert)
      .onConflictDoNothing();
      
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to invite members:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to invite members." 
    };
  }
}