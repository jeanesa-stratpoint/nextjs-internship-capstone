"use client";

import { Plus } from "lucide-react";
import CreateProjectModal from "@/components/modals/create-project-modal";
import GlobalInviteModal from "@/components/modals/global-invite-modal";

interface Project {
  id: string;
  name: string;
}

interface QuickActionsProps {
  canCreateProject: boolean;
  canInviteMember: boolean;
  userProjects: Project[]; 
}

export default function QuickActions({ canCreateProject, canInviteMember, userProjects }: QuickActionsProps) {
  return (
    <div className="flex flex-col items-start lg:items-end gap-2">
      <span className="text-xs font-bold text-black mb-1">Quick Actions</span>
      <div className="flex flex-wrap items-center gap-3">
        
        {canCreateProject && <CreateProjectModal />}

        {canInviteMember && (
          <GlobalInviteModal userProjects={userProjects} />
        )}

        <button 
          onClick={() => alert("Global Task Modal coming up next!")}
          className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white text-black"
        >
          <Plus size={16} className="text-gray-500" /> Create Task
        </button>

      </div>
    </div>
  );
}