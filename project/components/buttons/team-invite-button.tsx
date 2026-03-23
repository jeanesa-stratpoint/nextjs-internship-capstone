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
          ? "py-2.5 bg-black text-white hover:bg-gray-800 font-semibold"
          : "py-2 border border-gray-300 bg-white text-black hover:bg-gray-50 font-medium"
      }`}
    >
      {isPrimary ? (
        <UserPlus size={18} className="shrink-0" />
      ) : (
        <Plus size={16} className="text-gray-500 shrink-0" />
      )}
      {isPrimary ? "Invite Member" : "Add Team Member"}
    </button>
  );
}
