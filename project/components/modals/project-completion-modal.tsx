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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-200 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
          <PartyPopper size={40} />
        </div>
        <h3 className="text-2xl font-black text-black mb-3">Congratulations!</h3>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          All tasks for this project have been moved to the final stage. Would you like to
          officially mark this project as completed?
        </p>
        <div className="flex gap-3">
          <button
            onClick={closeProjectCompletionModal}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Not Yet
          </button>
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 flex justify-center items-center gap-2 py-3 font-bold rounded-xl transition-colors disabled:opacity-50 text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Complete Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
