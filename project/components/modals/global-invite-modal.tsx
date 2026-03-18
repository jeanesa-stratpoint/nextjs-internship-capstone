"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { X, Loader2, Search, FolderKanban, CheckCircle2 } from "lucide-react";
import { inviteMembersAction } from "@/actions/projects";
import { useUIStore } from "@/stores/ui-store";
import { useUser } from "@clerk/nextjs";
import { DbProject, TeamMember } from "@/types";

interface GlobalInviteModalProps {
  userProjects: DbProject[];
}

export default function GlobalInviteModal({ userProjects }: GlobalInviteModalProps) {
  const { user } = useUser();
  const { isGlobalInviteModalOpen, closeGlobalInviteModal, inviteProjectId } = useUIStore();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<TeamMember[]>([]);

  const handleClose = () => {
    closeGlobalInviteModal();
    setTimeout(() => {
      setSelectedProjectId("");
      setSelectedUsers([]);
      setSearchQuery("");
      setError("");
      setSuccessMessage("");
    }, 300);
  };

  useEffect(() => {
    if (isGlobalInviteModalOpen) {
      document.body.style.overflow = "hidden";

      if (inviteProjectId && typeof inviteProjectId === "string") {
        setSelectedProjectId(inviteProjectId);
      } else {
        setSelectedProjectId("");
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isGlobalInviteModalOpen, inviteProjectId]);

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
            (u: TeamMember) =>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const memberIds = selectedUsers.map((u) => u.id);
    const result = await inviteMembersAction(selectedProjectId, memberIds);

    if (result.success) {
      setSuccessMessage(`Successfully added ${selectedUsers.length} member(s) to the project!`);
    } else {
      setError(result.error || "Failed to invite members");
    }
    setIsSubmitting(false);
  };

  if (!isGlobalInviteModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {successMessage ? (
          <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Team Updated!</h2>
            <p className="text-gray-500 mb-8">{successMessage}</p>
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
              <h2 className="text-lg font-bold text-black">Invite Team Member</h2>
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
              <div className="space-y-6 mb-6">
                <div>
                  <label
                    htmlFor="projectId"
                    className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide"
                  >
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FolderKanban
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select
                      id="projectId"
                      required
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none cursor-pointer text-black"
                    >
                      <option value="" disabled>
                        Choose a project...
                      </option>
                      {userProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Search Users <span className="text-red-500">*</span>
                  </label>

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 bg-gray-100 pl-2 pr-1 py-1 rounded-full text-xs font-medium text-black"
                        >
                          {u.imageUrl ? (
                            <Image
                              src={u.imageUrl}
                              alt="Avatar"
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold flex-shrink-0">
                              {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                            </div>
                          )}
                          <span>{u.firstName || u.email.split("@")[0]}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUsers(selectedUsers.filter((usr) => usr.id !== u.id))
                            }
                            className="p-0.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex items-center px-3 py-2 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-black transition-all">
                      <Search size={16} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by email or name..."
                        className="w-full text-sm outline-none text-black bg-transparent py-1"
                      />
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
                              onClick={() => {
                                setSelectedUsers([...selectedUsers, u]);
                                setSearchQuery("");
                                setSearchResults([]);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                            >
                              {u.imageUrl ? (
                                <Image
                                  src={u.imageUrl}
                                  alt="Avatar"
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold flex-shrink-0">
                                  {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                                </div>
                              )}
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
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 flex-shrink-0 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProjectId || selectedUsers.length === 0}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    "Send Invites"
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
