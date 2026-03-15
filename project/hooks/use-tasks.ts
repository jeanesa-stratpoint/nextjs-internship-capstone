import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskAction, updateTaskAction, deleteTaskAction, updateTaskStatus, updateTaskOrderAction } from "@/actions/tasks";
import { updateListOrderAction, deleteListAction, clearListTasksAction, createListAction } from "@/actions/lists";

interface TaskPayload {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  listId: string;
  assigneeId?: string | null;
}

export function useProjectBoard(projectId: string) {
  return useQuery({
    queryKey: ["projectBoard", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/board`);
      if (!res.ok) throw new Error("Failed to fetch project board");
      return res.json();
    },
    enabled: !!projectId,
  });
}

// QUERIES (READS)

export function useTaskDefaults(projectId: string | null) {
  return useQuery({
    queryKey: ["taskDefaults", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/task-defaults`);
      if (!res.ok) throw new Error("Failed to fetch defaults");
      return res.json();
    },
    enabled: !!projectId, 
  });
}

export function useTaskDetails(taskId: string | null) {
  return useQuery({
    queryKey: ["taskDetails", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task details");
      return res.json();
    },
    enabled: !!taskId,
  });
}

// MUTATIONS (WRITES)

export function useTaskMutations(projectId: string) {
  const queryClient = useQueryClient();

  const invalidateBoard = () => {
    queryClient.invalidateQueries({ queryKey: ["taskDetails"] });
    queryClient.invalidateQueries({ queryKey: ["projectBoard", projectId] });
  };

  const createTask = useMutation({
    mutationFn: async (data: TaskPayload) => {
      const result = await createTaskAction(data, projectId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: TaskPayload }) => {
      const result = await updateTaskAction(taskId, projectId, data);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const moveTaskStatus = useMutation({
    mutationFn: async ({ taskId, newListId }: { taskId: string; newListId: string }) => {
      const result = await updateTaskStatus(taskId, newListId, projectId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const result = await deleteTaskAction(taskId, projectId);
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

  const updateTaskOrder = useMutation({
    mutationFn: async (taskUpdates: { id: string; order: number; listId: string }[]) => {
      const result = await updateTaskOrderAction(projectId, taskUpdates);
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

  const createList = useMutation({
    mutationFn: async ({ name, order, color }: { name: string; order: number; color: string }) => {
      const result = await createListAction(projectId, name, order, color);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  return {
    createTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    updateListOrder,
    updateTaskOrder,
    deleteList,
    clearListTasks,
    createList,
  };
}