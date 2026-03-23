"use client";

import { DbProject } from "@/types/index";
import { useUIStore } from "@/stores/ui-store";
import CreateProjectModal from "@/components/modals/create-project-modal";
import GlobalInviteModal from "@/components/modals/global-invite-modal";
import CreateTaskModal from "@/components/modals/create-task-modal";
import TaskDetailModal from "@/components/modals/task-detail-modal";
import TeamInviteButton from "@/components/buttons/team-invite-button";
import CreateProjectButton from "@/components/buttons/create-project-button";
import CreateTaskButton from "@/components/buttons/create-task-button";

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
  const { isCreateTaskModalOpen, closeCreateTaskModal } = useUIStore();

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

        {/* Modular Action Buttons */}
        {canCreateProject && <CreateProjectButton variant="outline" />}
        {canInviteMember && <TeamInviteButton variant="outline" />}
        {canCreateTask && <CreateTaskButton variant="outline" />}
      </div>
    </div>
  );
}
