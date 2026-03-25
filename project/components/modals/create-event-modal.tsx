"use client";

import { useState, useEffect } from "react";
import { X, Loader2, FolderKanban, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useEventMutations } from "@/hooks/use-events";
import { DbProject } from "@/types";

export default function CreateEventModal({ userProjects }: { userProjects: DbProject[] }) {
  const { isCreateEventModalOpen, closeCreateEventModal } = useUIStore();
  const { createEvent } = useEventMutations();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"meeting" | "milestone" | "reminder">("meeting");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [error, setError] = useState("");
  const [successEventName, setSuccessEventName] = useState("");

  const handleClose = () => {
    closeCreateEventModal();
    setTimeout(() => {
      setSelectedProjectId("");
      setTitle("");
      setDescription("");
      setType("meeting");
      setStartTime("");
      setEndTime("");
      setError("");
      setSuccessEventName("");
    }, 300);
  };

  useEffect(() => {
    if (isCreateEventModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCreateEventModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }
    setError("");

    try {
      await createEvent.mutateAsync({
        projectId: selectedProjectId,
        title,
        description: description || null,
        type,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
      setSuccessEventName(title);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create event");
    }
  };

  if (!isCreateEventModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {successEventName ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-zinc-100 mb-2">
              Event Scheduled!
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-8">
              <strong className="text-black dark:text-zinc-100">{successEventName}</strong> has been
              added to the calendar.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-300 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
              <h3 className="text-lg font-bold text-black dark:text-zinc-100 flex items-center gap-2">
                <CalendarIcon size={20} /> Schedule Event
              </h3>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500 dark:text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Project Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Project <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FolderKanban
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
                  />
                  <select
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm appearance-none cursor-pointer text-black dark:text-zinc-100"
                  >
                    <option value="" disabled>
                      Choose a project...
                    </option>
                    {userProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Event Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "meeting" | "milestone" | "reminder")}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm appearance-none text-black dark:text-zinc-100 cursor-pointer"
                >
                  <option value="meeting">Meeting</option>
                  <option value="milestone">Milestone</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              {/* Date/Time Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm text-gray-600 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    min={startTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm text-gray-600 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Description{" "}
                  <span className="text-gray-400 dark:text-zinc-500 font-normal lowercase">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add meeting link or details..."
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm resize-none text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-gray-100 dark:border-zinc-800 mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEvent.isPending || !title.trim() || !startTime || !endTime}
                  className="flex items-center gap-2 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 dark:hover:bg-zinc-300 transition-all disabled:opacity-50"
                >
                  {createEvent.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
