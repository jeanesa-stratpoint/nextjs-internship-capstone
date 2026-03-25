"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { hasSystemPermission } from "@/lib/rbac";
import { projectSchema, updateProjectMemberRoleSchema } from "@/lib/validations";
import { queries } from "@/lib/db/queries";
import { UTApi } from "uploadthing/server";
import { pusherServer } from "@/lib/pusher";

const utapi = new UTApi();

export async function createProjectAction(
  name: string, 
  description: string, 
  dueDate: string | null, 
  memberIds: string[] = []
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const canCreate = await hasSystemPermission(userId, "project:create");
    if (!canCreate) {
      return { success: false, error: "Access Denied: Only authorized users can create projects." };
    }

    const validationResult = projectSchema.safeParse({
      name: name,
      description: description || undefined,
      dueDate: dueDate || undefined,
    });

    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }

    const validatedData = validationResult.data;

    const newProject = await queries.projects.create({
      name: validatedData.name, 
      description: validatedData.description, 
      ownerId: userId, 
      dueDate: validatedData.dueDate || null,
    });

    const membersToInsert: { projectId: string; userId: string; role: "admin" | "member" }[] = [
      { projectId: newProject.id, userId: userId, role: "admin" },
      ...memberIds.map((id) => ({ 
        projectId: newProject.id, 
        userId: id, 
        role: "member" as const
      })),
    ];

    await queries.projects.addMembers(membersToInsert);
    
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    
    return { success: true, project: newProject };

  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create project." };
  }
}

export async function inviteMembersAction(projectId: string, memberIds: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canInvite = await hasSystemPermission(userId, "project-invite:create");
    if (!canInvite) return { success: false, error: "Access Denied: You cannot invite members." };

    if (!projectId || memberIds.length === 0) return { success: false, error: "Invalid data." };

    const project = await queries.projects.getById(projectId);
    if (!project) return { success: false, error: "Project not found." };

    const targetUsers = await queries.users.getByIds(memberIds);

    let newInvitesCount = 0;
    const alreadyInvitedNames: string[] = [];

    for (const targetUser of targetUsers) {
      const { invite, isNew } = await queries.projects.createInvitation({
        projectId,
        email: targetUser.email,
        invitedBy: userId
      });

      if (isNew) {
        newInvitesCount++;
        const newNotif = await queries.notifications.create({
          userId: targetUser.id,
          actorId: userId,
          type: "project_invite",
          title: "Project Invitation",
          message: `You have been invited to join the project "${project.name}".`,
          referenceId: invite.id
        });

        await pusherServer.trigger(`user-${targetUser.id}`, "new-notification", { 
          id: newNotif.id 
        });
      } else {
        const displayName = targetUser.firstName || targetUser.email.split("@")[0];
        alreadyInvitedNames.push(displayName);
      }
    }
      
    if (newInvitesCount === 0 && alreadyInvitedNames.length > 0) {
      return { 
        success: false, 
        error: `Invitations already pending for: ${alreadyInvitedNames.join(", ")}.` 
      };
    }
      
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/team"); 

    if (alreadyInvitedNames.length > 0) {
      return { 
        success: true, 
        message: `Sent ${newInvitesCount} invite(s). Note: ${alreadyInvitedNames.join(", ")} already had pending invites.` 
      };
    }

    return { success: true, message: `Successfully sent ${newInvitesCount} invitation(s)!` };
  } catch (error: unknown) {
    console.error("Failed to invite members:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to invite members." };
  }
}

export async function inviteUserByEmailAction(projectId: string, email: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canInvite = await hasSystemPermission(userId, "project-invite:create");
    if (!canInvite) return { success: false, error: "Access Denied: You cannot invite members." };

    if (!email || !email.includes("@")) return { success: false, error: "Valid email is required." };

    const cleanEmail = email.toLowerCase().trim();

    const client = await clerkClient();
    const clerkInvite = await client.invitations.createInvitation({
      emailAddress: cleanEmail,
      ignoreExisting: true,
      publicMetadata: { invitedToProjectId: projectId }
    });

    const { isNew } = await queries.projects.createInvitation({
      clerkId: clerkInvite.id,
      projectId,
      email: cleanEmail,
      invitedBy: userId
    });
    
    if (!isNew) {
      return { success: false, error: `Invitation already pending for ${cleanEmail}` };
    }

    revalidatePath("/team");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to send invitation:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to invite user." };
  }
}

export async function revokeInvitationAction(invitationId: string, clerkInviteId: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    if (clerkInviteId) {
      const client = await clerkClient();
      await client.invitations.revokeInvitation(clerkInviteId);
    }

    await queries.projects.revokeInvitation(invitationId);

    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to revoke invite:", error);
    return { success: false, error: "Failed to revoke invitation." };
  }
}

export async function updateProjectDetailsAction(projectId: string, data: { name: string; description: string; dueDate: string | null }) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "project:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    const project = await queries.projects.getById(projectId);
    if (!project) return { success: false, error: "Project not found." };

    const isOwner = project.ownerId === userId;
    const localRole = await queries.projects.getMemberRole(projectId, userId);
    const isProjectAdmin = localRole === "admin";

    if (!isOwner && !isProjectAdmin) {
      console.warn(`User ${userId} attempted to edit project ${projectId} without admin rights.`);
      return { 
        success: false, 
        error: "Access Denied: You must be a Project Admin or Owner to edit project details." 
      };
    }
    
    const validationResult = projectSchema.safeParse({
      name: data.name,
      description: data.description || undefined,
      dueDate: data.dueDate || undefined, 
    });

    if (!validationResult.success) return { success: false, error: validationResult.error.issues[0].message };

    await queries.projects.updateDetails(projectId, {
      name: validationResult.data.name,
      description: validationResult.data.description || null,
      dueDate: validationResult.data.dueDate || null,
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { success: false, error: "Failed to update project details." };
  }
}

export async function updateProjectStatusAction(projectId: string, status: "active" | "on-hold") {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "project:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    const project = await queries.projects.getById(projectId);
    if (!project) return { success: false, error: "Project not found." };

    const isOwner = project.ownerId === userId;
    const localRole = await queries.projects.getMemberRole(projectId, userId);
    const isProjectAdmin = localRole === "admin";

    if (!isOwner && !isProjectAdmin) {
      console.warn(`User ${userId} attempted to update status for project ${projectId} without admin rights.`);
      return { 
        success: false, 
        error: "Access Denied: You must be a Project Admin or Owner to change the project status." 
      };
    }
    
    await queries.projects.updateStatus(projectId, status);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to update project status:", error);
    return { success: false, error: "Failed to update project status." };
  }
}

export async function markProjectCompletedAction(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "project:edit");
    if (!canEdit) return { success: false, error: "Access Denied" };

    const projectLists = await queries.tasks.getListsByProject(projectId);
    if (projectLists.length === 0) return { success: false, error: "Project has no lists." };
    const lastList = projectLists[projectLists.length - 1];

    const allProjectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
    const tasksToMove = allProjectTasks.filter(t => t.listId !== lastList.id);

    if (tasksToMove.length > 0) {
       await Promise.all(tasksToMove.map(t => queries.tasks.updateStatus(t.id, lastList.id)));

       const newActivities = tasksToMove.map(t => {
          const oldList = projectLists.find(l => l.id === t.listId);
          return {
             taskId: t.id,
             userId,
             actionType: "moved",
             oldValue: oldList?.name || "Unknown",
             newValue: lastList.name
          };
       });
       await queries.tasks.logBulkActivities(newActivities);
    }
    await queries.projects.updateStatus(projectId, "completed");

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark project completed:", error);
    return { success: false, error: "Failed to complete project." };
  }
}

export async function deleteProjectAction(projectId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canDelete = await hasSystemPermission(userId, "project:delete");
    if (!canDelete) return { success: false, error: "Access Denied" };

    const project = await queries.projects.getById(projectId);
    if (!project) return { success: false, error: "Project not found." };

    if (project.ownerId !== userId) {
      console.warn(`User ${userId} attempted to delete project ${projectId} without ownership rights.`);
      return { 
        success: false, 
        error: "Access Denied: Only the project owner can delete this workspace." 
      };
    }

    const projectLists = await queries.tasks.getListsByProject(projectId);
    if (projectLists.length > 0) {
      const allProjectTasks = await queries.tasks.getByListIds(projectLists.map(l => l.id));
      const urlsToDelete = allProjectTasks.map(t => t.attachmentUrl).filter(Boolean);

      await deleteFilesFromUploadThing(urlsToDelete);
    }
    await queries.projects.delete(projectId);

    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { success: false, error: "Failed to delete project." };
  }
}

export async function removeMemberAction(projectId: string, memberId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canEdit = await hasSystemPermission(userId, "project:edit");
    if (!canEdit) return { success: false, error: "Access Denied: Missing global permissions." };

    const project = await queries.projects.getById(projectId);
    if (!project) return { success: false, error: "Project not found." };


    if (project.ownerId === memberId) {
      return { success: false, error: "Cannot remove the project owner." };
    }
    
    const isOwner = project.ownerId === userId;
    const localRole = await queries.projects.getMemberRole(projectId, userId);
    const isProjectAdmin = localRole === "admin";

    if (!isOwner && !isProjectAdmin) {
      console.warn(` User ${userId} attempted to remove a member from project ${projectId} without admin rights.`);
      return { 
        success: false, 
        error: "Access Denied: You must be a Project Admin or Owner to remove members." 
      };
    }

    await queries.projects.removeMember(projectId, memberId);
    await queries.tasks.unassignUserFromProjectTasks(projectId, memberId);

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { success: false, error: "Failed to remove team member." };
  }
}

export async function removeTeamMemberGlobalAction(memberId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const canManageTeam = await hasSystemPermission(userId, "project-invite:create");
    if (!canManageTeam) return { success: false, error: "Access Denied: You cannot manage team members." };

    await queries.projects.removeMemberFromAllOwnedProjects(userId, memberId);

    await queries.tasks.unassignUserFromAllOwnedProjectsTasks(userId, memberId);

    revalidatePath("/team");
    revalidatePath("/projects");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to remove team member globally:", error);
    return { success: false, error: "Failed to remove team member." };
  }
}

async function deleteFilesFromUploadThing(urls: (string | null | undefined)[]) {
  const keys = urls
    .filter((url): url is string => !!url)
    .map((url) => {
      const withoutHash = url.split("#")[0];
      const parts = withoutHash.split("/");
      return parts[parts.length - 1]; 
    })
    .filter((key) => !!key);

  if (keys.length > 0) {
    try {
      await utapi.deleteFiles(keys);
      console.log(`Successfully bulk-deleted ${keys.length} files from UploadThing for Project cleanup.`);
    } catch (error) {
      console.error("Failed to delete files from UploadThing:", error);
    }
  }
}

export async function updateProjectMemberRoleAction(projectId: string, memberIdToUpdate: string, newRole: "admin" | "member") {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validation = updateProjectMemberRoleSchema.safeParse({ projectId, memberIdToUpdate, newRole });
    
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }
    const canEdit = await hasSystemPermission(userId, "project:edit");
    if (!canEdit) return { success: false, error: "Access Denied: Missing global permissions." };

    const project = await queries.projects.getById(projectId);
    if (!project) return { success: false, error: "Project not found." };

    if (project.ownerId === memberIdToUpdate) {
      return { success: false, error: "The project owner's role cannot be modified." };
    }

    const isOwner = project.ownerId === userId;
    const localRole = await queries.projects.getMemberRole(projectId, userId);
    const isProjectAdmin = localRole === "admin";

    if (!isOwner && !isProjectAdmin) {
      console.warn(`User ${userId} attempted to change roles in project ${projectId} without admin rights.`);
      return { 
        success: false, 
        error: "Access Denied: You must be a Project Admin or Owner to manage team roles." 
      };
    }

    await queries.projects.updateMemberRole(projectId, memberIdToUpdate, newRole);

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return { success: false, error: "Failed to update team member role." };
  }
}