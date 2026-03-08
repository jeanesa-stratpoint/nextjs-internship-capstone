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

import { useState, useEffect } from "react";
import { X, Plus, Loader2, Search } from "lucide-react";
import { createProjectAction } from "@/actions/projects";
import { getTodayString } from "@/lib/utils";

// Define what the API returns so TypeScript is happy
interface SearchUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string;
}

export default function CreateProjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for the Team Member Search feature
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);

  // THE SCROLL LOCK
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // THE DEBOUNCED SEARCH API CALL
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out users we've already selected so they don't show up in the dropdown again
          const filtered = data.filter((user: SearchUser) => 
            !selectedUsers.some(selected => selected.id === user.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400); // Waits 400ms after you stop typing before fetching

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers]);

  const handleAddUser = (user: SearchUser) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery("");
    setSearchResults([]);
    setIsInviteOpen(false); // Close the input after selecting
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Extract just the IDs of the selected users to send to the database
    const memberIds = selectedUsers.map(u => u.id);
    const result = await createProjectAction(projectName, description, dueDate || null, memberIds);

    if (result.success) {
      setProjectName("");
      setDescription("");
      setDueDate("");
      setSelectedUsers([]);
      setSearchQuery("");
      setIsInviteOpen(false);
      setIsOpen(false);
    } else {
      console.error("Error:", result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors text-black bg-white"
      >
        <Plus size={16} className="text-gray-500" /> Create Project
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-black">Create New Project</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4 mb-6">
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none text-black"
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Due Date <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    min={getTodayString()}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
                  />
                </div>
                
                {/* --- INVITE TEAM MEMBERS SECTION --- */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Team Members
                  </label>

                  {/* Render Selected Users */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-2 bg-gray-100 pl-2 pr-1 py-1 rounded-full text-xs font-medium text-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={user.imageUrl} alt="Avatar" className="w-5 h-5 rounded-full" />
                          <span>{user.firstName || user.email.split('@')[0]}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveUser(user.id)}
                            className="p-0.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Invite Button / Search Input */}
                  {!isInviteOpen ? (
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(true)}
                      className="text-sm font-semibold text-gray-500 hover:text-black transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Invite Team Member
                    </button>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center px-3 py-2 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-black transition-all">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by email..."
                          className="w-full text-sm outline-none text-black bg-transparent"
                        />
                        <button type="button" onClick={() => {setIsInviteOpen(false); setSearchQuery("");}} className="text-gray-400 hover:text-black">
                          <X size={16} />
                        </button>
                      </div>

                      {/* Search Results Dropdown */}
                      {(searchQuery.length >= 2 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-3 text-center text-xs text-gray-500 flex justify-center items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map(user => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleAddUser(user)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-black">{user.firstName} {user.lastName}</span>
                                  <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-gray-500">No users found.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 flex-shrink-0">
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
                    <><Loader2 size={16} className="animate-spin" /> Creating...</>
                  ) : "Create Project"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}