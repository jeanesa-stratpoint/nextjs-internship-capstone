"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { X, Plus, Loader2, Search, CheckCircle2 } from "lucide-react";
import { getTodayString } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import { useProjectMutations } from "@/hooks/use-projects";

interface SearchUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string;
}

export default function CreateProjectModal() {
  const { user } = useUser();

  const { isCreateProjectModalOpen, closeCreateProjectModal } = useUIStore();

  const { createProject } = useProjectMutations();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdProject, setCreatedProject] = useState<{ id: string; name: string } | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);

  const handleClose = () => {
    closeCreateProjectModal();

    setTimeout(() => {
      setCreatedProject(null);
      setProjectName("");
      setDescription("");
      setDueDate("");
      setSelectedUsers([]);
      setSearchQuery("");
      setIsInviteOpen(false);
      setError("");
    }, 300);
  };

  useEffect(() => {
    if (isCreateProjectModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCreateProjectModalOpen]);

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
          const filtered = data.filter(
            (u: SearchUser) =>
              u.id !== user?.id && !selectedUsers.some((selected) => selected.id === u.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers, user?.id]);

  const handleAddUser = (u: SearchUser) => {
    setSelectedUsers([...selectedUsers, u]);
    setSearchQuery("");
    setSearchResults([]);
    setIsInviteOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const memberIds = selectedUsers.map((u) => u.id);

      const result = await createProject.mutateAsync({
        name: projectName,
        description,
        dueDate: dueDate || null,
        memberIds,
      });

      if (result.project) {
        setCreatedProject({ id: result.project.id, name: result.project.name });
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCreateProjectModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {createdProject ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Project Created!</h2>
            <p className="text-gray-500 mb-8">
              <strong className="text-black">{createdProject.name}</strong> is now ready for your
              team.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
              <Link
                href={`/projects/${createdProject.id}`}
                onClick={handleClose}
                className="flex-1 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Go to Board
              </Link>
            </div>
          </div>
        ) : (
          /* --- ORIGINAL FORM VIEW --- */
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-black">Create New Project</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              {/* ... All your exact form fields remain identical here ... */}
              <div className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="projectName"
                    className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide"
                  >
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
                  <label
                    htmlFor="description"
                    className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide"
                  >
                    Description{" "}
                    <span className="text-gray-400 font-normal lowercase">(optional)</span>
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
                  <label
                    htmlFor="dueDate"
                    className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide"
                  >
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

                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Team Members
                  </label>
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 bg-gray-100 pl-2 pr-1 py-1 rounded-full text-xs font-medium text-black"
                        >
                          <Image
                            src={u.imageUrl}
                            alt="Avatar"
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{u.firstName || u.email.split("@")[0]}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(u.id)}
                            className="p-0.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

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
                        <button
                          type="button"
                          onClick={() => {
                            setIsInviteOpen(false);
                            setSearchQuery("");
                          }}
                          className="text-gray-400 hover:text-black"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {(searchQuery.length >= 2 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-3 text-center text-xs text-gray-500 flex justify-center items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleAddUser(u)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                              >
                                <Image
                                  src={u.imageUrl}
                                  alt="Avatar"
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-black">
                                    {u.firstName} {u.lastName}
                                  </span>
                                  <span className="text-xs text-gray-500">{u.email}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-gray-500">
                              No users found.
                            </div>
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
                  onClick={handleClose}
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
                      <Loader2 size={16} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Project"
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
