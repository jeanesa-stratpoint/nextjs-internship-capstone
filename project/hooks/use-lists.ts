import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  updateListOrderAction, 
  deleteListAction, 
  clearListTasksAction, 
  createListAction,
  updateListDetailsAction,
} from "@/actions/lists";

export function useListMutations(projectId: string) {
  const queryClient = useQueryClient();

  const invalidateBoard = () => {
    queryClient.invalidateQueries({ queryKey: ["projectBoard", projectId] });
  };

  const createList = useMutation({
    mutationFn: async ({ name, order, color }: { name: string; order: number; color: string }) => {
      const result = await createListAction(projectId, name, order, color);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const updateListOrder = useMutation({
    mutationFn: async (listUpdates: { id: string; order: number }[]) => {
      const result = await updateListOrderAction(projectId, listUpdates);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const updateListDetails = useMutation({
    mutationFn: async ({ listId, name, color }: { listId: string; name: string; color: string }) => {
      const result = await updateListDetailsAction(projectId, listId, name, color);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      const result = await deleteListAction(projectId, listId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const clearListTasks = useMutation({
    mutationFn: async (listId: string) => {
      const result = await clearListTasksAction(projectId, listId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  return {
    createList,
    updateListOrder,
    updateListDetails,
    deleteList,
    clearListTasks,
  };
}