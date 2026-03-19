"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Mail, FolderKanban, Trash2, Copy, ExternalLink } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { useProjectMutations } from "@/hooks/use-projects";
import ConfirmActionModal from "@/components/modals/confirm-action-modal";
import Image from "next/image";
import Link from "next/link";

export type TeamMemberData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  activeProjectCount: number;
  imageUrl: string | null;
};

interface TeamCardProps {
  member: TeamMemberData;
  canManageTeam?: boolean;
}

export default function TeamCard({ member, canManageTeam }: TeamCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToastStore();
  const { removeTeamMemberGlobal } = useProjectMutations();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const initials = (member.firstName?.[0] || member.email[0]).toUpperCase();
  const fullName =
    `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email.split("@")[0];

  const isActive = member.activeProjectCount > 0;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(member.email);
    setIsMenuOpen(false);
    showToast({ message: "Email copied to clipboard!", type: "success", duration: 3000 });
  };

  const handleRemoveMember = async () => {
    setIsRemoving(true);

    try {
      await removeTeamMemberGlobal.mutateAsync(member.id);

      showToast({
        message: `${fullName} removed from your team.`,
        description: "This user has been removed from all of your shared projects.",
        type: "success",
      });
      setShowRemoveModal(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast({ message: error.message || "Failed to remove team member.", type: "error" });
      }
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <ConfirmActionModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member?"
        description={`Are you sure you want to remove ${fullName} from your team? They will lose access to all shared projects.`}
        confirmText="Remove Member"
        isLoading={isRemoving}
        isDestructive={true}
      />

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            {member.imageUrl ? (
              <Image
                src={member.imageUrl}
                alt="Avatar"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-50"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 text-gray-900 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white">
                {initials}
              </div>
            )}
            <div className="flex flex-col">
              <h3 className="font-bold text-black text-lg line-clamp-1">{fullName}</h3>
              <span className="text-xs font-semibold text-gray-500 uppercase">{member.role}</span>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-1.5 rounded-lg transition-colors ${
                isMenuOpen
                  ? "bg-gray-100 text-black"
                  : "text-gray-400 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <MoreHorizontal size={20} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                <Link
                  href="/projects"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                  <FolderKanban size={14} /> View Projects
                </Link>

                <div className="h-px bg-gray-100 my-1"></div>

                <button
                  onClick={handleCopyEmail}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                  <Copy size={14} /> Copy Email
                </button>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ExternalLink size={14} /> Send via Gmail
                </a>

                {canManageTeam && (
                  <>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowRemoveModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={14} /> Remove Member
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center text-sm font-medium text-gray-500 mb-6">
          <Mail size={16} className="mr-2 text-gray-400" />
          <span className="truncate">{member.email}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full ${
              isActive
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {isActive ? "Active" : "Available"}
          </span>
          <div className="text-sm font-bold text-black">
            {member.activeProjectCount} <span className="text-gray-400 font-medium">projects</span>
          </div>
        </div>
      </div>
    </>
  );
}
