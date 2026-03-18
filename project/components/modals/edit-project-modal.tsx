"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CalendarDays, AlignLeft, Type } from "lucide-react";
import { updateProjectDetailsAction } from "@/actions/projects";
import { getTodayString } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";
import { useUIStore } from "@/stores/ui-store";

export default function EditProjectModal() {
  const { isEditProjectModalOpen, closeEditProjectModal, selectedEditProject } = useUIStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToastStore();

  useEffect(() => {
    if (isEditProjectModalOpen && selectedEditProject) {
      setName(selectedEditProject.name);
      setDescription(selectedEditProject.description || "");
      setDueDate(
        selectedEditProject.dueDate
          ? new Date(selectedEditProject.dueDate).toISOString().split("T")[0]
          : ""
      );
      setError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isEditProjectModalOpen, selectedEditProject]);

  if (!isEditProjectModalOpen || !selectedEditProject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await updateProjectDetailsAction(selectedEditProject.id, {
        name: name.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
      });

      if (!result.success) throw new Error(result.error);

      showToast({ message: "Project updated successfully!", type: "success", duration: 3000 });
      closeEditProjectModal(); // ✨ Use store close action
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-black">Edit Project</h3>
          <button
            onClick={closeEditProjectModal}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Type size={14} /> Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <AlignLeft size={14} /> Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <CalendarDays size={14} /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              min={getTodayString()}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-gray-600"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={closeEditProjectModal}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
