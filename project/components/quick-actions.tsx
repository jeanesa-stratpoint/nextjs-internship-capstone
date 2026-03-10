"use client";

import { Plus } from "lucide-react";
import CreateProjectModal from "@/components/modals/create-project-modal";
import GlobalInviteModal from "@/components/modals/global-invite-modal";
import { useUIStore } from "@/stores/ui-store";

interface Project { id: string; name: string; }
interface QuickActionsProps { canCreateProject: boolean; canInviteMember: boolean; userProjects: Project[]; }

export default function QuickActions({ canCreateProject, canInviteMember, userProjects }: QuickActionsProps) {
  // 2. Consume the actions to open the modals
  const { openCreateProjectModal, openGlobalInviteModal, openCreateTaskModal } = useUIStore();

  return (
    <div className="flex flex-col items-start lg:items-end gap-2">
      <span className="text-xs font-bold text-black mb-1">Quick Actions</span>
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Render the "dumb" modal overlays in the background */}
        <CreateProjectModal />
        <GlobalInviteModal userProjects={userProjects} />

        {/* 1. Create Project Trigger */}
        {canCreateProject && (
          <button 
            onClick={openCreateProjectModal}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500" /> Create Project
          </button>
        )}

        {/* 2. Add Team Member Trigger */}
        {canInviteMember && (
          <button 
            onClick={openGlobalInviteModal}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors bg-white text-black"
          >
            <Plus size={16} className="text-gray-500" /> Add Team Member
          </button>
        )}

        {/* 3. Create Task Trigger */}
        <button 
          onClick={openCreateTaskModal}
          className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors bg-white text-black"
        >
          <Plus size={16} className="text-gray-500" /> Create Task
        </button>

      </div>
    </div>
  );
}