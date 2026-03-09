// TODO: Task 5.3 - Set up client-side state management with Zustand
// TODO: Task 5.4 - Implement optimistic UI updates for smooth interactions

/*
TODO: Implementation Notes for Interns:

Board state management for Kanban functionality:
- Current project data
- Lists/columns
- Tasks
- Drag and drop state
- Optimistic updates
- Sync with server

Key features:
- Optimistic task creation/updates
- Drag and drop state management
- Real-time synchronization
- Conflict resolution
- Offline support (optional)

Example structure:
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface BoardState {
  // Data
  currentProject: Project | null
  lists: List[]
  tasks: Task[]
  
  // UI state
  draggedTask: Task | null
  draggedOverList: string | null
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  
  // Actions
  loadProject: (projectId: string) => Promise<void>
  createTask: (listId: string, task: Partial<Task>) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  moveTask: (taskId: string, newListId: string, newPosition: number) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  
  // Drag and drop
  setDraggedTask: (task: Task | null) => void
  setDraggedOverList: (listId: string | null) => void
}

export const useBoardStore = create<BoardState>()(
  subscribeWithSelector((set, get) => ({
    // ... implementation
  }))
)
*/

// Placeholder to prevent import errors
// export const useBoardStore = () => {
//   console.log("TODO: Implement board store with Zustand");
//   return {
//     currentProject: null,
//     lists: [],
//     tasks: [],
//     isLoading: false,
//     loadProject: (projectId: string) => console.log(`TODO: Load project ${projectId}`),
//     createTask: (listId: string, task: any) =>
//       console.log(`TODO: Create task in list ${listId}`, task),
//   };
// };

import { create } from "zustand";

export interface Task {
  id: string;
  listId: string;
  title: string;
  order: number;
  description?: string | null;
  priority?: string | null;
  dueDate?: Date | string | null;
  assigneeId?: string | null;
  createdAt?: Date | string;
}

export interface List {
  id: string;
  name: string;
  order: number;
}

interface BoardState {
  lists: List[];
  tasks: Task[];

  isLoading: boolean;

  setBoardData: (lists: List[], tasks: Task[]) => void;

  moveTask: (taskId: string, newListId: string, newOrder: number) => void;
  reorderTask: (taskId: string, newOrder: number) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  lists: [],
  tasks: [],
  isLoading: false,

  setBoardData: (lists, tasks) => set({ lists, tasks }),

  moveTask: (taskId, newListId, newOrder) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, listId: newListId, order: newOrder } : task
      ),
    })),


  reorderTask: (taskId, newOrder) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, order: newOrder } : task)),
    })),
}));
