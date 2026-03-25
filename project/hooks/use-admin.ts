import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserSystemRole, toggleRolePermission } from "@/actions/admin";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  // 1. Fetch Users
  const { data: systemUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // 2. Fetch Roles
  const { data: availableRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  // 3. Fetch Permissions Matrix
  const { data: permissionsData, isLoading: isLoadingPerms } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/permissions");
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
  });

  // 4. Update User Role Mutation
  const changeUserRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      return await updateUserSystemRole(userId, roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  // 5. Toggle Permission Mutation
  const togglePermission = useMutation({
    mutationFn: async (params: { roleId: string; permissionId: string; assign: boolean }) => {
      return await toggleRolePermission(params.roleId, params.permissionId, params.assign);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
  });

  return {
    systemUsers,
    availableRoles,
    permissionsData,
    isLoading: isLoadingUsers || isLoadingRoles || isLoadingPerms,
    changeUserRole,
    togglePermission,
  };
}