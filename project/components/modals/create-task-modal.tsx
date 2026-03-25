"use client";

import { useState, useEffect } from "react";
import { X, Loader2, FolderDot, CheckCircle2, FolderKanban } from "lucide-react";
import { getTodayString } from "@/lib/utils";
import { useTaskDefaults, useTaskMutations } from "@/hooks/use-tasks";
import { DbProject, TeamMember } from "@/types/index";
import RichTextEditor from "@/components/rich-text-editor";
import { useUploadThing } from "@/lib/uploadthing";
import { Paperclip } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId?: string;
  projectId?: string;
  projectName?: string;
  projectTeam?: TeamMember[];
  projectDueDate?: Date | null;
  userProjects?: DbProject[];
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  listId: initialListId,
  projectId: initialProjectId,
  projectName: initialProjectName,
  projectTeam: initialProjectTeam,
  projectDueDate: initialProjectDueDate,
  userProjects,
}: CreateTaskModalProps) {
  const isGlobalMode = !initialProjectId;

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const activeProjectId = isGlobalMode ? selectedProjectId : initialProjectId;

  const { data: defaults, isLoading: isLoadingContext } = useTaskDefaults(activeProjectId || null);
  const { createTask } = useTaskMutations(activeProjectId || "");

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const [error, setError] = useState("");
  const [successTaskName, setSuccessTaskName] = useState("");

  const [contentHtml, setContentHtml] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { startUpload, isUploading } = useUploadThing("taskAttachment");

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSelectedProjectId(initialProjectId || "");
      setTitle("");
      setContentHtml("");
      setSelectedFile(null);
      setPriority("medium");
      setDueDate("");
      setAssigneeId("");
      setError("");
      setSuccessTaskName("");
    }, 300);
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalListId = isGlobalMode ? defaults?.listId : initialListId;

    if (!activeProjectId) {
      setError("Please select a project.");
      return;
    }
    if (!finalListId) {
      setError("This project has no columns to add a task to.");
      return;
    }

    setError("");

    try {
      let finalAttachmentUrl = undefined;

      if (selectedFile) {
        const customFileName = selectedFile.name
          .toLowerCase()
          .replace(/[^a-z0-9.]/g, "_")
          .replace(/_+/g, "_");

        const renamedFile = new File([selectedFile], customFileName, { type: selectedFile.type });

        const res = await startUpload([renamedFile]);
        if (!res) throw new Error("File upload failed. Please try again.");

        finalAttachmentUrl = `${res[0].ufsUrl}#${encodeURIComponent(customFileName)}`;
      }

      const plainTextDescription = contentHtml.replace(/<[^>]*>?/gm, "").trim();

      await createTask.mutateAsync({
        title,
        contentHtml: contentHtml || undefined,
        description: plainTextDescription || null,
        attachmentUrl: finalAttachmentUrl,
        priority,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
        listId: finalListId,
      });

      setSuccessTaskName(title);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create task");
    }
  };

  if (!isOpen) return null;

  const currentTeam: TeamMember[] = isGlobalMode ? defaults?.team || [] : initialProjectTeam || [];

  const activeDueDate = isGlobalMode ? defaults?.projectDueDate : initialProjectDueDate;
  const maxDateString = activeDueDate
    ? new Date(activeDueDate).toISOString().split("T")[0]
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {successTaskName ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-zinc-100 mb-2">Task Created!</h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-8">
              <strong className="text-black dark:text-zinc-100">{successTaskName}</strong> has been
              added.
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
              <h3 className="text-lg font-bold text-black dark:text-zinc-100">Create New Task</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100"
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
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Project <span className="text-red-500">*</span>
                </label>
                {isGlobalMode ? (
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
                      {userProjects?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full px-4 py-3 bg-gray-100 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-500 dark:text-zinc-400 cursor-not-allowed">
                    <FolderDot size={18} />
                    <span className="font-semibold">{initialProjectName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Assignee{" "}
                  {isLoadingContext && (
                    <Loader2
                      size={12}
                      className="inline animate-spin ml-1 text-gray-400 dark:text-zinc-500"
                    />
                  )}
                </label>
                <select
                  disabled={isGlobalMode && (!selectedProjectId || isLoadingContext)}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm appearance-none disabled:bg-gray-100 dark:disabled:bg-zinc-900 disabled:text-gray-400 dark:disabled:text-zinc-600 text-black dark:text-zinc-100 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {currentTeam.map((member: TeamMember) => (
                    <option key={member.id} value={member.id}>
                      {`${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design homepage mockup"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Description/Task Details
                </label>
                <RichTextEditor
                  value={contentHtml}
                  onChange={setContentHtml}
                  placeholder="Add formatting, lists, and details here..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide flex items-center gap-2">
                  <Paperclip size={14} /> Attachment
                </label>

                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl group">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate pr-4">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full py-6 bg-gray-50 dark:bg-zinc-900/50 border-2 border-gray-300 dark:border-zinc-700 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-zinc-400">
                      <Paperclip size={24} className="mb-2 text-gray-400 dark:text-zinc-500" />
                      <p className="text-sm font-medium">Click to select a file</p>
                      <p className="text-xs mt-1">PDF or Image (Max 4MB/8MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm appearance-none text-black dark:text-zinc-100 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    min={getTodayString()}
                    max={maxDateString}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-sm text-gray-600 dark:text-zinc-300"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-gray-100 dark:border-zinc-800 mt-4 bg-gray-50/50 dark:bg-zinc-900/50 p-6 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createTask.isPending ||
                    isUploading ||
                    (isGlobalMode && !selectedProjectId) ||
                    !title.trim()
                  }
                  className="flex items-center gap-2 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 dark:hover:bg-zinc-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading...
                    </>
                  ) : createTask.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Create Task"
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
