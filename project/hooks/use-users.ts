import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserRoleAction } from "@/actions/users";

export function useUserMutations() {
  const queryClient = useQueryClient();

  const updateRole = useMutation({
    mutationFn: async (roleId: string) => {
      const result = await updateUserRoleAction(roleId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    }
  });

  return { updateRole };
}