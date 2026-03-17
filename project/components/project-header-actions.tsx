"use client";

import { Users, CalendarDays, CheckCircle2 } from "lucide-react";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";

export default function ProjectHeaderActions({ canEditProject }: { canEditProject: boolean }) {
  const { lists, tasks } = useBoardStore();
  const { openProjectCompletionModal } = useUIStore();

  const endListId = lists.length > 0 ? lists[lists.length - 1].id : null;
  const allTasksCompleted =
    tasks.length > 0 && endListId && tasks.every((t) => t.listId === endListId);

  return (
    <div className="flex items-center gap-4">
      {allTasksCompleted && canEditProject && (
        <button
          onClick={openProjectCompletionModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-bold hover:bg-green-100 transition-colors animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <CheckCircle2 size={16} /> Mark as Completed
        </button>
      )}

      <button className="text-gray-500 hover:text-black transition-colors">
        <Users size={24} />
      </button>
      <button className="text-gray-500 hover:text-black transition-colors">
        <CalendarDays size={24} />
      </button>
    </div>
  );
}
