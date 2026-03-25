"use client";

import { useState } from "react";
import { MailX, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useProjectMutations } from "@/hooks/use-projects";
import { useToastStore } from "@/stores/toast-store";
import { SentInvitation } from "@/types/index";
import { formatDate, calculateExpiryDate, isDateExpired } from "@/lib/utils";
import ConfirmActionModal from "./modals/confirm-action-modal";

const ITEMS_PER_PAGE = 5;

export default function PendingInvitationsList({ invitations }: { invitations: SentInvitation[] }) {
  const { revokeInvitation } = useProjectMutations();
  const { showToast } = useToastStore();

  const [inviteToRevoke, setInviteToRevoke] = useState<SentInvitation | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(invitations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvitations = invitations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleRevoke = async () => {
    if (!inviteToRevoke) return;
    setIsRevoking(true);

    try {
      await revokeInvitation.mutateAsync({
        invitationId: inviteToRevoke.id,
        clerkInviteId: inviteToRevoke.clerkId,
      });
      showToast({ message: "Invitation revoked successfully", type: "success" });

      if (paginatedInvitations.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch {
      showToast({ message: "Failed to revoke invitation", type: "error" });
    } finally {
      setIsRevoking(false);
      setInviteToRevoke(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="mt-10 mb-10 animate-in fade-in duration-500">
      <ConfirmActionModal
        isOpen={!!inviteToRevoke}
        onClose={() => setInviteToRevoke(null)}
        onConfirm={handleRevoke}
        title="Revoke Invitation?"
        description={`Are you sure you want to revoke the invitation sent to ${inviteToRevoke?.email}? The link in their email will no longer work.`}
        confirmText="Revoke"
        isLoading={isRevoking}
        isDestructive={true}
      />

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-black dark:text-zinc-100">
        <MailX size={20} className="text-gray-400 dark:text-zinc-500" />
        Sent Invitations
      </h2>

      <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-zinc-400 uppercase bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Project</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Sent On</th>
                <th className="px-6 py-4 font-bold">Expires</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
              {paginatedInvitations.map((invite) => {
                const expiryDate = calculateExpiryDate(invite.createdAt, 30);

                let displayStatus = invite.status;
                if (displayStatus === "pending" && isDateExpired(expiryDate)) {
                  displayStatus = "expired";
                }

                return (
                  <tr
                    key={invite.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-black dark:text-zinc-100">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-zinc-300">
                      {invite.project.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-xl uppercase ${
                          displayStatus === "pending"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                            : displayStatus === "accepted"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : displayStatus === "revoked"
                                ? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                      {formatDate(invite.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                      {["revoked", "accepted", "declined"].includes(displayStatus)
                        ? "—"
                        : formatDate(expiryDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {displayStatus === "pending" && (
                        <button
                          onClick={() => setInviteToRevoke(invite)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <XCircle size={14} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-800/20">
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-900 dark:text-zinc-100">{startIndex + 1}</span>{" "}
              to{" "}
              <span className="font-bold text-gray-900 dark:text-zinc-100">
                {Math.min(startIndex + ITEMS_PER_PAGE, invitations.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-900 dark:text-zinc-100">
                {invitations.length}
              </span>{" "}
              entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
