"use client";

import { Plus } from "lucide-react";
import CreateProjectModal from "@/components/modals/create-project-modal";
import GlobalInviteModal from "@/components/modals/global-invite-modal";
import CreateTaskModal from "@/components/modals/create-task-modal";
import { useUIStore } from "@/stores/ui-store";
import TaskDetailModal from "@/components/modals/task-detail-modal";
import { DbProject } from "@/types";

interface QuickActionsProps {
  canCreateProject: boolean;
  canInviteMember: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  userProjects: DbProject[];
}

export default function QuickActions({
  canCreateProject,
  canInviteMember,
  canCreateTask,
  canEditTask,
  canDeleteTask,
  userProjects,
}: QuickActionsProps) {
  const {
    openCreateProjectModal,
    openGlobalInviteModal,
    isCreateTaskModalOpen,
    closeCreateTaskModal,
    openCreateTaskModal,
  } = useUIStore();

  return (
    <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
      <span className="text-xs font-bold text-black mb-1">Quick Actions</span>
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <CreateProjectModal />
        <GlobalInviteModal userProjects={userProjects} />
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={closeCreateTaskModal}
          userProjects={userProjects}
        />
        <TaskDetailModal canEditTask={canEditTask} canDeleteTask={canDeleteTask} />

        {canCreateProject && (
          <button
            onClick={openCreateProjectModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500 shrink-0" /> Create Project
          </button>
        )}

        {canInviteMember && (
          <button
            onClick={() => openGlobalInviteModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500 shrink-0" /> Add Team Member
          </button>
        )}

        {canCreateTask && (
          <button
            onClick={openCreateTaskModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500 shrink-0" /> Create Task
          </button>
        )}
      </div>
    </div>
  );
}
