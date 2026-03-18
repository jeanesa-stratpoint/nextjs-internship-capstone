import { create } from 'zustand';
import { DbProject } from '@/types';

interface UIState {
  isCreateProjectModalOpen: boolean;
  isGlobalInviteModalOpen: boolean;
  inviteProjectId: string | null;
  isCreateTaskModalOpen: boolean;
  isTaskDetailModalOpen: boolean;
  selectedTaskId: string | null;
  isProjectCompletionModalOpen: boolean;
  isEditProjectModalOpen: boolean;
  selectedEditProject: DbProject | null;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;

  // actions
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  
  openGlobalInviteModal: (projectId?: string) => void;
  closeGlobalInviteModal: () => void;
  
  openCreateTaskModal: () => void;
  closeCreateTaskModal: () => void;

  openTaskDetailModal: (taskId: string) => void;
  closeTaskDetailModal: () => void;

  openProjectCompletionModal: () => void;
  closeProjectCompletionModal: () => void;

  openEditProjectModal: (project: DbProject) => void;
  closeEditProjectModal: () => void;

  toggleSidebar: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCreateProjectModalOpen: false,
  isGlobalInviteModalOpen: false,
  inviteProjectId: null,
  isCreateTaskModalOpen: false,
  isTaskDetailModalOpen: false,
  selectedTaskId: null,
  isProjectCompletionModalOpen: false,
  isEditProjectModalOpen: false,
  selectedEditProject: null,
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,

  // actions
  openCreateProjectModal: () => set({ isCreateProjectModalOpen: true }),
  closeCreateProjectModal: () => set({ isCreateProjectModalOpen: false }),

  openGlobalInviteModal: (projectId?: string) => set({ 
    isGlobalInviteModalOpen: true, 
    inviteProjectId: typeof projectId === "string" ? projectId : null 
  }),
  closeGlobalInviteModal: () => set({ 
    isGlobalInviteModalOpen: false, 
    inviteProjectId: null 
  }),

  openCreateTaskModal: () => set({ isCreateTaskModalOpen: true }),
  closeCreateTaskModal: () => set({ isCreateTaskModalOpen: false }),

  openTaskDetailModal: (taskId) => set({ isTaskDetailModalOpen: true, selectedTaskId: taskId }),
  closeTaskDetailModal: () => set({ isTaskDetailModalOpen: false, selectedTaskId: null }),

  openProjectCompletionModal: () => set({ isProjectCompletionModalOpen: true }),
  closeProjectCompletionModal: () => set({ isProjectCompletionModalOpen: false }),

  openEditProjectModal: (project) => set({ isEditProjectModalOpen: true, selectedEditProject: project }),
  closeEditProjectModal: () => set({ isEditProjectModalOpen: false, selectedEditProject: null }),

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
}));
