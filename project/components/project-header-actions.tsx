"use client";

import { useState } from "react";
import { MoreVertical, CheckCircle2, UserPlus, X, Trash2, Edit } from "lucide-react";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { DbProject, TeamMember } from "@/types";
import { removeMemberAction, deleteProjectAction } from "@/actions/projects";
import { useRouter } from "next/navigation";
import { useToastStore, DEFAULT_TOAST_DURATION } from "@/stores/toast-store";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import ConfirmActionModal from "./modals/confirm-action-modal";

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
  const { openProjectCompletionModal, openGlobalInviteModal, openEditProjectModal } = useUIStore();

  const { showToast } = useToastStore();
  const queryClient = useQueryClient();

  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const endListId = lists.length > 0 ? lists[lists.length - 1].id : null;
  const allTasksCompleted =
    tasks.length > 0 && endListId && tasks.every((t) => t.listId === endListId);

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);

    const res = await removeMemberAction(project.id, memberToRemove.id);

    if (res.success) {
      showToast({ message: "Member removed from project", type: "success" });
    } else {
      showToast({ message: res.error || "Failed to remove member", type: "error" });
    }

    setIsRemoving(false);
    setMemberToRemove(null);
  };

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
        await deleteProjectAction(project.id);
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
        isLoading={false}
      />
      <ConfirmActionModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveMember}
        title="Remove Team Member?"
        description={`Are you sure you want to remove ${memberToRemove?.firstName || "this user"} from the project? They will lose access to all tasks and lists.`}
        confirmText="Remove Member"
        isLoading={isRemoving}
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

        {/* TEAM MENU */}
        <div className="relative">
          <button
            onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
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

          {isTeamMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsTeamMenuOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20">
                {canEditProject && (
                  <button
                    onClick={() => {
                      setIsTeamMenuOpen(false);
                      openGlobalInviteModal(project.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-black hover:bg-gray-50 rounded-lg mb-2"
                  >
                    <UserPlus size={16} className="text-gray-500" /> Add Member
                  </button>
                )}
                <div className="text-xs font-bold text-gray-400 uppercase px-3 mb-2">
                  Project Team
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {team.map((user) => {
                    const isOwner = user.id === project.ownerId;
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg group"
                      >
                        <div className="flex flex-col overflow-hidden pr-2">
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            {`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                              user.email.split("@")[0]}
                          </span>
                          {isOwner && (
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              Owner
                            </span>
                          )}
                        </div>

                        {canEditProject && !isOwner && (
                          <button
                            onClick={() => setMemberToRemove(user)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* SETTINGS MENU */}
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
