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
  userProjects: DbProject[];
}

export default function QuickActions({
  canCreateProject,
  canInviteMember,
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
    <div className="flex flex-col items-start lg:items-end gap-2">
      <span className="text-xs font-bold text-black mb-1">Quick Actions</span>
      <div className="flex flex-wrap items-center gap-3">
        <CreateProjectModal />
        <GlobalInviteModal userProjects={userProjects} />
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={closeCreateTaskModal}
          userProjects={userProjects}
        />
        <TaskDetailModal />

        {canCreateProject && (
          <button
            onClick={openCreateProjectModal}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500" /> Create Project
          </button>
        )}

        {canInviteMember && (
          <button
            onClick={openGlobalInviteModal}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500" /> Add Team Member
          </button>
        )}

        <button
          onClick={openCreateTaskModal}
          className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
        >
          <Plus size={16} className="text-gray-500" /> Create Task
        </button>
      </div>
    </div>
  );
}
