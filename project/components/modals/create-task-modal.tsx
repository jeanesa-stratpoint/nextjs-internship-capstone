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
import { X, Loader2, FolderDot } from "lucide-react";
import { createTaskAction } from "@/actions/tasks";
import { useRouter } from "next/navigation";
import { getTodayString } from "@/lib/utils"; // <-- Your new Date Utility!
import { TeamMember } from "../kanban-board";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  projectId: string;
  projectName: string; // <-- Catching the project name
  projectTeam: TeamMember[];
}

export default function CreateTaskModal({ isOpen, onClose, listId, projectId, projectName, projectTeam }: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // THE SCROLL LOCK: Identical to your Project Modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      assigneeId: formData.get("assigneeId") || null,
      ...(formData.get("dueDate") && { dueDate: formData.get("dueDate") }),
      listId: listId,
    };

    const result = await createTaskAction(data, projectId);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error as string);
    }
    
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[20px] p-6 w-full max-w-md mx-4 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Create New Task</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          
          {/* THE NEW READ-ONLY PROJECT NAME FIELD */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Project</label>
            <div className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed">
              <FolderDot size={16} />
              <span className="font-semibold">{projectName}</span>
            </div>
          </div>

          <div>
              <label htmlFor="assigneeId" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Assignee</label>
              <select
                id="assigneeId"
                name="assigneeId"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {projectTeam.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Design homepage mockup"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Add more details about this task..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Priority</label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* UPGRADED DUE DATE FIELD */}
            <div>
              <label htmlFor="dueDate" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                min={getTodayString()} // <--- BLOCKS PAST DATES!
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-gray-600"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? "Saving..." : "Create Task"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}