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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {createdProject ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-zinc-100 mb-2">
              Project Created!
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-8">
              <strong className="text-black dark:text-zinc-100">{createdProject.name}</strong> is
              now ready for your team.
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Done
              </button>
              <Link
                href={`/projects/${createdProject.id}`}
                onClick={handleClose}
                className="flex-1 py-3 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-300 transition-colors text-center"
              >
                Go to Board
              </Link>
            </div>
          </div>
        ) : (
          /* --- ORIGINAL FORM VIEW --- */
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
              <h2 className="text-lg font-bold text-black dark:text-zinc-100">
                Create New Project
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              {/* ... All your exact form fields remain identical here ... */}
              <div className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="projectName"
                    className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide"
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
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide"
                  >
                    Description{" "}
                    <span className="text-gray-400 dark:text-zinc-500 font-normal lowercase">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what this project is about..."
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all resize-none text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dueDate"
                    className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide"
                  >
                    Due Date{" "}
                    <span className="text-gray-400 dark:text-zinc-500 font-normal lowercase">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    min={getTodayString()}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-all text-black dark:text-zinc-100"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2 uppercase tracking-wide">
                    Team Members
                  </label>
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 pl-2 pr-1 py-1 rounded-full text-xs font-medium text-black dark:text-zinc-100"
                        >
                          <Image
                            src={u.imageUrl}
                            alt="Avatar"
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover bg-gray-200 dark:bg-zinc-700"
                          />
                          <span>{u.firstName || u.email.split("@")[0]}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(u.id)}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-500 dark:text-zinc-400"
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
                      className="text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={16} /> Invite Team Member
                    </button>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-xl focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-zinc-600 transition-all">
                        <Search size={16} className="text-gray-400 dark:text-zinc-500 mr-2" />
                        <input
                          type="text"
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by email..."
                          className="w-full text-sm outline-none text-black dark:text-zinc-100 bg-transparent py-1 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsInviteOpen(false);
                            setSearchQuery("");
                          }}
                          className="text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-100"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {(searchQuery.length >= 2 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-3 text-center text-xs text-gray-500 dark:text-zinc-400 flex justify-center items-center gap-2">
                              <Loader2 size={14} className="animate-spin" /> Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleAddUser(u)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
                              >
                                {u.imageUrl ? (
                                  <Image
                                    src={u.imageUrl}
                                    alt="Avatar"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-xs text-blue-700 dark:text-blue-400 font-bold flex-shrink-0">
                                    {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-black dark:text-zinc-100">
                                    {u.firstName} {u.lastName}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                                    {u.email}
                                  </span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-gray-500 dark:text-zinc-400">
                              No users found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 flex-shrink-0 border-t border-gray-100 dark:border-zinc-800 mt-4 bg-gray-50/50 dark:bg-zinc-900/50 p-6 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !projectName.trim()}
                  className="flex items-center gap-2 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 dark:hover:bg-zinc-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
