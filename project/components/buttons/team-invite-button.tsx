"use client";

import { UserPlus, Plus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface TeamInviteButtonProps {
  variant?: "primary" | "outline";
}

export default function TeamInviteButton({ variant = "primary" }: TeamInviteButtonProps) {
  const { openGlobalInviteModal } = useUIStore();

  const isPrimary = variant === "primary";

  return (
    <button
      onClick={() => openGlobalInviteModal()}
      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 rounded-full text-sm transition-colors ${
        isPrimary
          ? "py-2.5 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-300 font-semibold"
          : "py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium"
      }`}
    >
      {isPrimary ? (
        <UserPlus size={18} className="shrink-0" />
      ) : (
        <Plus size={16} className="text-gray-500 dark:text-zinc-400 shrink-0" />
      )}
      {isPrimary ? "Invite Member" : "Add Team Member"}
    </button>
  );
}
