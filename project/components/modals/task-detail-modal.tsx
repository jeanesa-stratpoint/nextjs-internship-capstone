"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  CalendarDays,
  Flag,
  User,
  Clock,
  MessageSquare,
  Trash2,
  Activity,
} from "lucide-react";
import { getFullTaskDetailsAction, updateTaskAction } from "@/actions/tasks";
import { useUIStore } from "@/stores/ui-store";
import { getTodayString, formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface FeedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface FeedItem {
  id: string;
  feedType: "comment" | "activity";
  createdAt: Date | string;
  content?: string;
  actionType?: string;
  oldValue?: string | null;
  newValue?: string | null;
  user?: FeedUser | null;
}

interface ProjectDetails {
  id: string;
  name: string;
  dueDate?: Date | null;
}

interface ServerComment {
  id: string;
  content: string;
  createdAt: Date | string;
  isEdited: boolean;
  user: FeedUser | null;
}

interface ServerActivity {
  id: string;
  actionType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date | string;
  user: FeedUser | null;
}

export default function TaskDetailModal() {
  const { isTaskDetailModalOpen, selectedTaskId, closeTaskDetailModal } = useUIStore();

  // Fetched Data States
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  // Editable Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // 1. Define fetchTaskData OUTSIDE the useEffect using useCallback
  const fetchTaskData = useCallback(async (taskId: string) => {
    setIsLoading(true);
    setError("");

    const result = await getFullTaskDetailsAction(taskId);

    if (result.success && result.task && result.project) {
      setProject(result.project as ProjectDetails);
      setTeam((result.team as TeamMember[]) || []);
      setCreatedAt(result.task.createdAt);

      setTitle(result.task.title);
      setDescription(result.task.description || "");
      setPriority(result.task.priority || "medium");
      setDueDate(
        result.task.dueDate ? new Date(result.task.dueDate).toISOString().split("T")[0] : ""
      );
      setAssigneeId(result.task.assigneeId || "");

      const rawComments: FeedItem[] = (result.comments || []).map((c: ServerComment) => ({
        ...c,
        feedType: "comment",
      }));
      const rawActivities: FeedItem[] = (result.activities || []).map((a: ServerActivity) => ({
        ...a,
        feedType: "activity",
      }));

      const combinedFeed = [...rawComments, ...rawActivities].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setFeed(combinedFeed);
    } else {
      setError("Failed to load task details.");
    }

    setIsLoading(false);
  }, []); // <-- Empty dependency array keeps it stable

  // 2. Now the useEffect just calls it!
  // 2a. Effect for CSS Scroll Lock (DOM Mutation)
  useEffect(() => {
    if (isTaskDetailModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isTaskDetailModalOpen]);

  // 2b. Effect for Data Fetching (State Mutation)
  useEffect(() => {
    if (isTaskDetailModalOpen && selectedTaskId) {
      // Wrapping it in an async function pushes it out of the synchronous render flow
      const loadData = async () => {
        await fetchTaskData(selectedTaskId);
      };
      loadData();
    }
  }, [isTaskDetailModalOpen, selectedTaskId, fetchTaskData]);

  const handleClose = () => {
    closeTaskDetailModal();
    // Wait for animation before clearing to prevent UI flashes
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setFeed([]);
      setError("");
    }, 300);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !project) return;

    setIsSaving(true);
    setError("");

    // 1. Send the updated data to the server
    const result = await updateTaskAction(selectedTaskId, project.id, {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
    });

    if (result.success) {
      // 2. Instantly re-fetch the task data so the new activity logs pop up on the right side!
      await fetchTaskData(selectedTaskId);
    } else {
      setError(result.error as string);
    }

    setIsSaving(false);
  };

  if (!isTaskDetailModalOpen) return null;

  // Validation boundary for the calendar
  const maxDateString = project?.dueDate
    ? new Date(project.dueDate).toISOString().split("T")[0]
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div className="bg-[#F8F8F8] rounded-[24px] shadow-2xl w-full max-w-5xl max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              {project?.name || "Loading Project..."}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="text-2xl font-bold text-black bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300 w-full max-w-xl"
              placeholder="Task Title..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete Task"
            >
              <Trash2 size={20} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">Loading task details...</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* LEFT COLUMN: EDIT FORM */}
            <div className="flex-1 md:w-3/5 p-8 overflow-y-auto border-r border-gray-200 bg-white">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                  {error}
                </div>
              )}

              <form id="edit-task-form" onSubmit={handleSaveChanges} className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm resize-y text-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  {/* Assignee */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <User size={14} /> Assignee
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <Flag size={14} /> Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <CalendarDays size={14} /> Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      min={getTodayString()}
                      max={maxDateString}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black"
                    />
                  </div>

                  {/* Created At (Read Only) */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <Clock size={14} /> Created
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed">
                      {createdAt ? formatDate(createdAt) : "Unknown"}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !title.trim()}
                    className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
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

            {/* RIGHT COLUMN: ACTIVITY & COMMENTS FEED */}
            <div className="flex-1 md:w-2/5 flex flex-col bg-[#F8F8F8]">
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
                <h3 className="font-bold text-black flex items-center gap-2">
                  <Activity size={16} /> Activity & Comments
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {feed.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-10">No activity yet.</p>
                ) : (
                  feed.map((item) => {
                    const userName = item.user
                      ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() ||
                        "Unknown User"
                      : "Unknown User";
                    const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    });

                    // Render a Comment
                    if (item.feedType === "comment") {
                      return (
                        <div key={`comment-${item.id}`} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {userName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-sm font-bold text-black">{userName}</span>
                              <span className="text-xs text-gray-400">{timeAgo}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl rounded-tl-none border border-gray-200 shadow-sm text-sm text-black">
                              {item.content}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render an Activity Log
                    if (item.feedType === "activity") {
                      return (
                        <div key={`activity-${item.id}`} className="flex gap-3 items-start">
                          <div className="mt-1 w-8 flex justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-black">{userName}</span>{" "}
                            {item.actionType === "created" && `added this task to ${project?.name}`}
                            {item.actionType === "moved" && `moved this to ${item.newValue}`}
                            {item.actionType === "assigned" && `assigned this to ${item.newValue}`}
                            {item.actionType === "updated" && `updated the ${item.oldValue}`}
                            <span className="text-xs text-gray-400 ml-2">{timeAgo}</span>
                          </div>
                        </div>
                      );
                    }
                  })
                )}
              </div>

              {/* Comment Input Placeholder */}
              <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all text-black"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                    <MessageSquare size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
