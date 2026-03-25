"use client";

import { useState } from "react";
import { MoreVertical, CheckCircle2, Trash2, Edit } from "lucide-react";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { DbProject, TeamMember } from "@/types/index";
import { useProjectMutations } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";
import { useToastStore, DEFAULT_TOAST_DURATION } from "@/stores/toast-store";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import ConfirmActionModal from "./modals/confirm-action-modal";
import ProjectTeamModal from "./modals/project-team-modal"; // <-- Ensure this is imported!

interface HeaderProps {
  project: DbProject;
  team: TeamMember[];
  canEditProject: boolean;
  canDeleteProject: boolean;
}

export default function ProjectHeaderActions({
  project,
  team,
  canEditProject,
  canDeleteProject,
}: HeaderProps) {
  const router = useRouter();
  const { lists, tasks } = useBoardStore();
  const { openProjectCompletionModal, openEditProjectModal, openGlobalInviteModal } = useUIStore();

  const { showToast } = useToastStore();
  const queryClient = useQueryClient();
  const { deleteProject } = useProjectMutations();

  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const endListId = lists.length > 0 ? lists[lists.length - 1].id : null;
  const allTasksCompleted =
    tasks.length > 0 && endListId && tasks.every((t) => t.listId === endListId);

  const handleDeleteProject = () => {
    setShowDeleteModal(false);

    const queryKey = ["projects"];
    const previousProjects = queryClient.getQueryData(queryKey);

    queryClient.setQueryData(queryKey, (oldData: { project: DbProject }[] | undefined) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((p) => p.project.id !== project.id);
    });

    router.push("/projects");

    let isUndone = false;

    const timerId = setTimeout(async () => {
      if (!isUndone) {
        try {
          await deleteProject.mutateAsync(project.id);
        } catch (error) {
          console.error(error);
        }
      }
    }, DEFAULT_TOAST_DURATION);

    showToast({
      message: "Project moved to trash",
      description: "Will be permanently deleted in 5 seconds.",
      action: {
        label: "Undo",
        onClick: () => {
          isUndone = true;
          clearTimeout(timerId);
          queryClient.setQueryData(queryKey, previousProjects);

          router.push(`/projects/${project.id}`);
          showToast({ message: "Project restored!", type: "success" });
        },
      },
    });
  };

  return (
    <>
      <ConfirmActionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project?"
        description="Are you sure you want to permanently delete this project? This cannot be undone."
        confirmText="Delete Project"
        isLoading={false}
      />

      <ProjectTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        projectId={project.id}
        team={team}
        projectOwnerId={project.ownerId}
        hasEditAccess={canEditProject}
        openInviteModal={() => openGlobalInviteModal(project.id)}
      />

      <div className="flex items-center gap-4">
        {allTasksCompleted && canEditProject && project.status !== "completed" && (
          <button
            onClick={openProjectCompletionModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-bold hover:bg-green-100 transition-colors animate-in fade-in duration-300"
          >
            <CheckCircle2 size={16} /> Mark as Completed
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <div className="flex -space-x-2 mr-1">
              {team.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  className="w-8 h-8 rounded-full border-2 border-[#F8F8F8] bg-gray-300 text-gray-900 flex items-center justify-center text-[10px] font-bold z-10 overflow-hidden"
                >
                  {u.imageUrl ? (
                    <Image
                      src={u.imageUrl}
                      alt="User"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    (u.firstName?.[0] || u.email[0]).toUpperCase()
                  )}
                </div>
              ))}
              {team.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-[#F8F8F8] bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold z-0">
                  +{team.length - 3}
                </div>
              )}
            </div>
          </button>
        </div>

        {(canEditProject || canDeleteProject) && (
          <div className="relative">
            <button
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {isSettingsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSettingsMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  {canEditProject && (
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        openEditProjectModal(project);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit size={14} /> Edit Details
                    </button>
                  )}
                  {canEditProject && canDeleteProject && (
                    <div className="h-px bg-gray-100 my-1"></div>
                  )}
                  {canDeleteProject && (
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={14} /> Delete Project
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
