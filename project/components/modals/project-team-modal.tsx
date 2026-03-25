"use client";

import { useState } from "react";
import { Loader2, X, Shield, User, UserPlus } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { useProjectMutations } from "@/hooks/use-projects";

type TeamMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role?: string;
  jobTitle?: string | null;
};

export default function ProjectTeamModal({
  isOpen,
  onClose,
  projectId,
  team,
  projectOwnerId,
  hasEditAccess,
  openInviteModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  team: TeamMember[];
  projectOwnerId: string;
  hasEditAccess: boolean;
  openInviteModal: () => void;
}) {
  const { showToast } = useToastStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { updateMemberRole, removeMember } = useProjectMutations();

  if (!isOpen) return null;

  const handleRoleChange = async (memberId: string, newRole: "admin" | "member") => {
    setLoadingId(memberId);
    try {
      await updateMemberRole.mutateAsync({ projectId, memberId, role: newRole });
      showToast({ message: "Role updated successfully.", type: "success" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update role.";
      showToast({ message: errorMessage, type: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    setLoadingId(memberId);
    try {
      await removeMember.mutateAsync({ projectId, memberId });
      showToast({ message: "Member removed from project.", type: "success" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove member.";
      showToast({ message: errorMessage, type: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-black dark:text-zinc-100">Manage Team</h2>

            {/* The "Add Member" Button */}
            {hasEditAccess && (
              <button
                onClick={() => {
                  onClose();
                  openInviteModal();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-sm font-bold text-black dark:text-zinc-100 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <UserPlus size={16} className="text-gray-600 dark:text-zinc-300" />
                Add Member
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Team List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {team.map((member) => {
            const isOwner = member.id === projectOwnerId;
            const isSelfLoading = loadingId === member.id;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800/80"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 font-bold shrink-0">
                    {member.firstName?.charAt(0) || member.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-black dark:text-zinc-100 truncate">
                      {member.firstName} {member.lastName} {isOwner && "(Owner)"}
                    </span>

                    <span className="text-xs font-medium text-gray-700 dark:text-zinc-400 truncate">
                      {member.jobTitle || "Standard User"}
                    </span>

                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">
                      {member.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelfLoading && (
                    <Loader2 size={16} className="animate-spin text-gray-400 dark:text-zinc-500" />
                  )}

                  {hasEditAccess && !isOwner ? (
                    <>
                      <select
                        disabled={isSelfLoading}
                        defaultValue={member.role || "member"}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as "admin" | "member")
                        }
                        className="text-xs font-medium border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 cursor-pointer disabled:opacity-50 dark:disabled:bg-zinc-800"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isSelfLoading}
                        className="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                      {isOwner ? (
                        <Shield size={12} className="text-black dark:text-zinc-100" />
                      ) : (
                        <User size={12} className="text-gray-500 dark:text-zinc-400" />
                      )}
                      <span className="text-xs font-medium text-gray-600 dark:text-zinc-300 capitalize">
                        {isOwner ? "Owner" : member.role || "Member"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
