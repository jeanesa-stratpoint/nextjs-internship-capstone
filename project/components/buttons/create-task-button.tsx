"use client";

import { Plus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface CreateTaskButtonProps {
  variant?: "primary" | "outline";
  className?: string;
}

export default function CreateTaskButton({
  variant = "outline",
  className = "",
}: CreateTaskButtonProps) {
  const { openCreateTaskModal } = useUIStore();
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={openCreateTaskModal}
      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 transition-colors text-sm ${
        isPrimary
          ? "py-2.5 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-800 dark:hover:bg-zinc-300 font-semibold rounded-full shadow-sm hover:shadow-md"
          : "py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium rounded-full"
      } ${className}`}
    >
      <Plus
        size={16}
        className={
          isPrimary
            ? "text-white dark:text-zinc-900 shrink-0"
            : "text-gray-500 dark:text-zinc-400 shrink-0"
        }
      />
      Create Task
    </button>
  );
}
