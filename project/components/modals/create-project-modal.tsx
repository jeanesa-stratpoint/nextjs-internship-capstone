// // TODO: Task 4.1 - Implement project CRUD operations
// // TODO: Task 4.4 - Build task creation and editing functionality

// /*
// TODO: Implementation Notes for Interns:

// Modal for creating new projects with form validation.

// Features to implement:
// - Form with project name, description, due date
// - Zod validation
// - Error handling
// - Loading states
// - Success feedback
// - Team member assignment
// - Project template selection

// Form fields:
// - Name (required)
// - Description (optional)
// - Due date (optional)
// - Team members (optional)
// - Project template (optional)
// - Privacy settings

// Integration:
// - Use project validation schema from lib/validations.ts
// - Call project creation API
// - Update project list optimistically
// - Handle errors gracefully
// */

// export function CreateProjectModal() {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white dark:bg-outer_space-500 rounded-lg p-6 w-full max-w-md mx-4">
//         <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
//           TODO: Create Project Modal
//         </h3>
//         <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
//           <p className="text-sm text-yellow-800 dark:text-yellow-200">
//             📋 Implement project creation form with validation
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { createProjectAction } from "@/actions/projects";

export default function CreateProjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Call the Server Action
    const result = await createProjectAction(projectName, description);

    if (result.success) {
      // If it worked, clear the form and close the modal
      setProjectName("");
      setDescription("");
      setIsOpen(false);
    } else {
      console.error("Error:", result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <>
      {/* 1. The Trigger Button (Matches your Figma UI exactly) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors text-black bg-white"
      >
        <Plus size={16} className="text-gray-500" /> Create Project
      </button>

      {/* 2. The Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          
          {/* 3. The Modal Content Box */}
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-black">Create New Project</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4 mb-8">
                <div>
                  <label htmlFor="projectName" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Website Redesign"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Description <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what this project is about..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none text-black"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !projectName.trim()}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}