// TODO: Task 4.4 - Build task creation and editing functionality
// TODO: Task 5.6 - Create task detail modals and editing interfaces

/*
TODO: Implementation Notes for Interns:

Modal for creating and editing tasks.

Features to implement:
- Task title and description
- Priority selection
- Assignee selection
- Due date picker
- Labels/tags
- Attachments
- Comments section (for edit mode)
- Activity history (for edit mode)

Form fields:
- Title (required)
- Description (rich text editor)
- Priority (low/medium/high)
- Assignee (team member selector)
- Due date (date picker)
- Labels (tag input)
- Attachments (file upload)

Integration:
- Use task validation schema
- Call task creation/update API
- Update board state optimistically
- Handle file uploads
- Real-time updates for comments
*/

// export function CreateTaskModal() {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white dark:bg-outer_space-500 rounded-lg p-6 w-full max-w-2xl mx-4">
//         <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
//           TODO: Create/Edit Task Modal
//         </h3>
//         <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
//           <p className="text-sm text-yellow-800 dark:text-yellow-200">
//             📋 Implement task creation/editing form with rich features
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { X, Loader2, FolderDot, CheckCircle2, FolderKanban } from "lucide-react";
import { getTodayString } from "@/lib/utils";
import { useTaskDefaults, useTaskMutations } from "@/hooks/use-tasks";

interface Project {
  id: string;
  name: string;
}
// 1. UPDATED INTERFACE: Added 'email' so TypeScript knows it exists
interface UnifiedTeamMember {
  id: string;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId?: string;
  projectId?: string;
  projectName?: string;
  projectTeam?: UnifiedTeamMember[];
  projectDueDate?: Date | null;
  userProjects?: Project[];
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
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const [error, setError] = useState("");
  const [successTaskName, setSuccessTaskName] = useState("");

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSelectedProjectId(initialProjectId || "");
      setTitle("");
      setDescription("");
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
      await createTask.mutateAsync({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
        listId: finalListId,
      });

      setSuccessTaskName(title);
    } catch (err: unknown) {
      // 2. FIXED: Safely checking the error type instead of using 'any'
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create task");
    }
  };

  if (!isOpen) return null;

  const currentTeam: UnifiedTeamMember[] = isGlobalMode
    ? defaults?.team || []
    : initialProjectTeam || [];
  const activeDueDate = isGlobalMode ? defaults?.projectDueDate : initialProjectDueDate;
  const maxDateString = activeDueDate
    ? new Date(activeDueDate).toISOString().split("T")[0]
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {successTaskName ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Task Created!</h2>
            <p className="text-gray-500 mb-8">
              <strong className="text-black">{successTaskName}</strong> has been added.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-black">Create New Task</h3>
              <button
                onClick={onClose}
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

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Project <span className="text-red-500">*</span>
                </label>
                {isGlobalMode ? (
                  <div className="relative">
                    <FolderKanban
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select
                      required
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none cursor-pointer text-black"
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
                  <div className="flex items-center gap-2 w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed">
                    <FolderDot size={18} />
                    <span className="font-semibold">{initialProjectName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Assignee{" "}
                  {isLoadingContext && (
                    <Loader2 size={12} className="inline animate-spin ml-1 text-gray-400" />
                  )}
                </label>
                <select
                  disabled={isGlobalMode && (!selectedProjectId || isLoadingContext)}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none disabled:bg-gray-100 disabled:text-gray-400 text-black cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {/* 3. FIXED: Used the UnifiedTeamMember type instead of 'any' */}
                  {currentTeam.map((member: UnifiedTeamMember) => (
                    <option key={member.id} value={member.id}>
                      {member.name ||
                        `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                        member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design homepage mockup"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm resize-none text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Priority
                  </label>
                  {/* 4. FIXED: Cast to strict priority literal union instead of 'any' */}
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none text-black"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    min={getTodayString()}
                    max={maxDateString}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-gray-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createTask.isPending || (isGlobalMode && !selectedProjectId) || !title.trim()
                  }
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createTask.isPending ? (
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
