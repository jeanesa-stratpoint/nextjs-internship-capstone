"use client";

import { Plus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface CreateProjectButtonProps {
  variant?: "primary" | "outline";
  className?: string;
}

export default function CreateProjectButton({
  variant = "outline",
  className = "",
}: CreateProjectButtonProps) {
  const { openCreateProjectModal } = useUIStore();
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={openCreateProjectModal}
      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 transition-colors text-sm ${
        isPrimary
          ? "py-2.5 bg-black text-white hover:bg-gray-800 font-semibold rounded-full shadow-sm hover:shadow-md"
          : "py-2 border border-gray-300 bg-white text-black hover:bg-gray-50 font-medium rounded-full"
      } ${className}`}
    >
      <Plus size={16} className={isPrimary ? "text-white shrink-0" : "text-gray-500 shrink-0"} />
      Create Project
    </button>
  );
}
