import { create } from 'zustand';

interface UIState {
  isCreateProjectModalOpen: boolean;
  isGlobalInviteModalOpen: boolean;
  isCreateTaskModalOpen: boolean;
  isTaskDetailModalOpen: boolean;
  selectedTaskId: string | null;
  isProjectCompletionModalOpen: boolean;

  // actions
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  
  openGlobalInviteModal: () => void;
  closeGlobalInviteModal: () => void;
  
  openCreateTaskModal: () => void;
  closeCreateTaskModal: () => void;

  openTaskDetailModal: (taskId: string) => void;
  closeTaskDetailModal: () => void;

  openProjectCompletionModal: () => void;
  closeProjectCompletionModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCreateProjectModalOpen: false,
  isGlobalInviteModalOpen: false,
  isCreateTaskModalOpen: false,
  isTaskDetailModalOpen: false,
  selectedTaskId: null,
  isProjectCompletionModalOpen: false,

  // actions
  openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),

  openGlobalInviteModal: () => set({ isGlobalInviteModalOpen: true }),
  closeGlobalInviteModal: () => set({ isGlobalInviteModalOpen: false }),

  openCreateTaskModal: () => set({ isCreateTaskModalOpen: true }),
  closeCreateTaskModal: () => set({ isCreateTaskModalOpen: false }),

  openTaskDetailModal: (taskId) => set({ isTaskDetailModalOpen: true, selectedTaskId: taskId }),
  closeTaskDetailModal: () => set({ isTaskDetailModalOpen: false, selectedTaskId: null }),

  openProjectCompletionModal: () => set({ isProjectCompletionModalOpen: true }),
  closeProjectCompletionModal: () => set({ isProjectCompletionModalOpen: false })
}));
