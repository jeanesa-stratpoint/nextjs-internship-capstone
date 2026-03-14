// TODO: Task 4.4 - Build task creation and editing functionality
// TODO: Task 5.4 - Implement optimistic UI updates for smooth interactions

/*
TODO: Implementation Notes for Interns:

Custom hook for task data management:
- Fetch tasks for a project
- Create new task
- Update task
- Delete task
- Move task between lists
- Bulk operations

Features:
- Optimistic updates for smooth UX
- Real-time synchronization
- Conflict resolution
- Undo functionality
- Batch operations

Example structure:
export function useTasks(projectId: string) {
  const queryClient = useQueryClient()
  
  const {
    data: tasks,
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => queries.tasks.getByProject(projectId),
    enabled: !!projectId
  })
  
  const createTask = useMutation({
    mutationFn: queries.tasks.create,
    onMutate: async (newTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })
      const previousTasks = queryClient.getQueryData(['tasks', projectId])
      queryClient.setQueryData(['tasks', projectId], (old: Task[]) => [...old, { ...newTask, id: 'temp-' + Date.now() }])
      return { previousTasks }
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks', projectId], context?.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    }
  })
  
  return {
    tasks,
    isLoading,
    error,
    createTask: createTask.mutate,
    isCreating: createTask.isPending
  }
}
*/

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskAction, updateTaskAction, deleteTaskAction, updateTaskStatus } from "@/actions/tasks";

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
    // Refresh the Edit Modal
    queryClient.invalidateQueries({ queryKey: ["taskDetails"] });
    // Refresh the Kanban Board!
    queryClient.invalidateQueries({ queryKey: ["projectBoard", projectId] });
  };

  const createTask = useMutation({
    // 2. Replaced 'any' with TaskPayload
    mutationFn: async (data: TaskPayload) => {
      const result = await createTaskAction(data, projectId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateBoard,
  });

  const updateTask = useMutation({
    // 3. Replaced 'any' with TaskPayload
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

  return {
    createTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
  };
}