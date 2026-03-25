"use client";

import { useEffect, useState } from "react";
import { PartyPopper, Loader2 } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useProjectMutations } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";

export default function ProjectCompletionModal({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { isProjectCompletionModalOpen, closeProjectCompletionModal } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { markProjectCompleted } = useProjectMutations();

  useEffect(() => {
    if (isProjectCompletionModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isProjectCompletionModalOpen]);

  if (!isProjectCompletionModalOpen) return null;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await markProjectCompleted.mutateAsync(projectId);

      closeProjectCompletionModal();
      router.push("/projects");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 shadow-inner dark:shadow-none">
          <PartyPopper size={40} />
        </div>
        <h3 className="text-2xl font-black text-black dark:text-zinc-100 mb-3">Congratulations!</h3>
        <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
          All tasks for this project have been moved to the final stage. Would you like to
          officially mark this project as completed?
        </p>
        <div className="flex gap-3">
          <button
            onClick={closeProjectCompletionModal}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Not Yet
          </button>
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 flex justify-center items-center gap-2 py-3 font-bold rounded-xl transition-colors disabled:opacity-50 text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-md hover:shadow-lg dark:shadow-none"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Complete Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
