import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProjectAction,
  updateProjectDetailsAction,
  updateProjectStatusAction,
  markProjectCompletedAction,
  deleteProjectAction,
  inviteMembersAction,
  removeMemberAction,
  removeTeamMemberGlobalAction,
  inviteUserByEmailAction,
  revokeInvitationAction,
  updateProjectMemberRoleAction
} from "@/actions/projects";

// MUTATIONS (WRITES)
export function useProjectMutations() {
  const queryClient = useQueryClient();
  
  const createProject = useMutation({
    mutationFn: async (data: { name: string; description: string; dueDate: string | null; memberIds: string[] }) => {
      const result = await createProjectAction(data.name, data.description, data.dueDate, data.memberIds);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const updateProjectDetails = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: { name: string; description: string; dueDate: string | null } }) => {
      const result = await updateProjectDetailsAction(projectId, data);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const updateProjectStatus = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: "active" | "on-hold" }) => {
      const result = await updateProjectStatusAction(projectId, status);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const markProjectCompleted = useMutation({
    mutationFn: async (projectId: string) => {
      const result = await markProjectCompletedAction(projectId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const result = await deleteProjectAction(projectId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const inviteMembers = useMutation({
    mutationFn: async ({ projectId, memberIds }: { projectId: string; memberIds: string[] }) => {
      const result = await inviteMembersAction(projectId, memberIds);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const inviteUserByEmail = useMutation({
    mutationFn: async ({ projectId, email }: { projectId: string; email: string }) => {
      const result = await inviteUserByEmailAction(projectId, email);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ projectId, memberId }: { projectId: string; memberId: string }) => {
      const result = await removeMemberAction(projectId, memberId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const removeTeamMemberGlobal = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeTeamMemberGlobalAction(memberId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const revokeInvitation = useMutation({
    mutationFn: async ({ invitationId, clerkInviteId }: { invitationId: string; clerkInviteId: string | null }) => {
      const result = await revokeInvitationAction(invitationId, clerkInviteId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ projectId, memberId, role }: { projectId: string; memberId: string; role: "admin" | "member" }) => {
      const result = await updateProjectMemberRoleAction(projectId, memberId, role);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  return {
    createProject,
    updateProjectDetails,
    updateProjectStatus,
    markProjectCompleted,
    deleteProject,
    inviteMembers,
    inviteUserByEmail,
    removeMember,
    removeTeamMemberGlobal,
    revokeInvitation,
    updateMemberRole
  };
}