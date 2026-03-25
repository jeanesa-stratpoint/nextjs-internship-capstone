"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  X,
  Loader2,
  CalendarDays,
  Flag,
  User,
  MessageSquare,
  Trash2,
  Activity,
  LayoutList,
  Paperclip,
  Download,
  Edit2,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { getTodayString, formatRelativeTime } from "@/lib/utils";
import { useTaskDetails, useTaskMutations } from "@/hooks/use-tasks";
import { DbProject, DbList, DbComment, DbActivity, DbTask, TeamMember } from "@/types";
import { useUploadThing } from "@/lib/uploadthing";
import { useQueryClient } from "@tanstack/react-query";
import { useToastStore, DEFAULT_TOAST_DURATION } from "@/stores/toast-store";
import { getPusherClient } from "@/lib/pusher";
import RichTextEditor from "@/components/rich-text-editor";
import ConfirmActionModal from "@/components/modals/confirm-action-modal";

interface FeedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

type ServerComment = DbComment & { user: FeedUser | null };
type ServerActivity = DbActivity & { user: FeedUser | null };

interface FeedItem {
  id: string;
  feedType: "comment" | "activity";
  createdAt: Date | string;
  content?: string;
  actionType?: string;
  oldValue?: string | null;
  newValue?: string | null;
  user?: FeedUser | null;
  isEdited?: boolean;
}

interface TaskData {
  task: DbTask;
  project: DbProject;
  projectLists: DbList[];
  team: TeamMember[];
  comments: ServerComment[];
  activities: ServerActivity[];
}

const FALLBACK_POLLING_INTERVAL_MS = 60 * 1000;

export default function TaskDetailModal({
  canEditTask = true,
  canDeleteTask = true,
}: {
  canEditTask?: boolean;
  canDeleteTask?: boolean;
}) {
  const { isTaskDetailModalOpen, selectedTaskId, closeTaskDetailModal } = useUIStore();
  const [isPusherConnected, setIsPusherConnected] = useState(false);

  useEffect(() => {
    if (!isTaskDetailModalOpen) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const handleStateChange = () => {
      setIsPusherConnected(pusher.connection.state === "connected");
    };

    const initialCheckTimer = setTimeout(handleStateChange, 0);

    pusher.connection.bind("state_change", handleStateChange);

    return () => {
      clearTimeout(initialCheckTimer);
      pusher.connection.unbind("state_change", handleStateChange);
    };
  }, [isTaskDetailModalOpen]);

  const { data, isLoading } = useTaskDetails(
    isTaskDetailModalOpen ? selectedTaskId : null,
    isPusherConnected ? false : FALLBACK_POLLING_INTERVAL_MS
  );
  console.log("Is Pusher Connected?", isPusherConnected);

  useEffect(() => {
    if (isTaskDetailModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isTaskDetailModalOpen]);

  if (!isTaskDetailModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div className="bg-[#F8F8F8] rounded-[24px] shadow-2xl w-full max-w-5xl h-[95vh] md:h-[85vh] min-h-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col relative">
        {isLoading || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Loader2 size={32} className="animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">Loading task details...</p>
          </div>
        ) : (
          <TaskDetailContent
            key={selectedTaskId}
            data={data as TaskData}
            taskId={selectedTaskId as string}
            onClose={closeTaskDetailModal}
            canEditTask={canEditTask}
            canDeleteTask={canDeleteTask}
          />
        )}
      </div>
    </div>
  );
}

function TaskDetailContent({
  data,
  taskId,
  onClose,
  canEditTask,
  canDeleteTask,
}: {
  data: TaskData;
  taskId: string;
  onClose: () => void;
  canEditTask: boolean;
  canDeleteTask: boolean;
}) {
  const { userId: currentUserId } = useAuth();
  const { updateTask, deleteTask, createComment, editComment } = useTaskMutations(data.project.id);
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `task-${taskId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-comment", (newCommentData: ServerComment) => {
      queryClient.setQueryData(["taskDetails", taskId], (oldData: TaskData | undefined) => {
        if (!oldData) return oldData;
        const exists = oldData.comments.some((c) => c.id === newCommentData.id);
        if (exists) return oldData;
        return { ...oldData, comments: [newCommentData, ...oldData.comments] };
      });
    });

    channel.bind("comment-edited", (updatedCommentData: ServerComment) => {
      queryClient.setQueryData(["taskDetails", taskId], (oldData: TaskData | undefined) => {
        if (!oldData) return oldData;
        const updatedComments = oldData.comments.map((c) =>
          c.id === updatedCommentData.id ? updatedCommentData : c
        );
        return { ...oldData, comments: updatedComments };
      });
    });

    channel.bind("new-activity", (newActivities: ServerActivity[]) => {
      queryClient.setQueryData(["taskDetails", taskId], (oldData: TaskData | undefined) => {
        if (!oldData) return oldData;

        const existingIds = new Set(oldData.activities.map((a) => a.id));
        const uniqueNew = newActivities.filter((a) => !existingIds.has(a.id));
        if (uniqueNew.length === 0) return oldData;

        return { ...oldData, activities: [...uniqueNew, ...oldData.activities] };
      });
    });

    return () => {
      channel.unbind("new-comment");
      channel.unbind("new-activity");
      pusher.unsubscribe(channelName);
    };
  }, [taskId, queryClient]);

  const handleEditSubmit = async (commentId: string) => {
    if (!editingContent.trim() || editingContent === "<p></p>") return;

    try {
      await editComment.mutateAsync({ commentId, taskId, content: editingContent });
      setEditingCommentId(null);
      setEditingContent("");
    } catch (err: unknown) {
      console.error(err);
      showToast({ message: "Failed to edit comment", type: "error" });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await createComment.mutateAsync({ taskId, content: newComment.trim() });
      setNewComment("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast({ message: err.message || "Failed to post comment", type: "error" });
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    if (!url) return "Attachment";
    if (url.includes("#")) {
      return decodeURIComponent(url.split("#").pop() || "Attachment");
    }
    return decodeURIComponent(url.split("/").pop() || "Attachment");
  };

  const [title, setTitle] = useState(data.task.title);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    data.task.priority || "medium"
  );

  const [attachmentUrl, setAttachmentUrl] = useState(data.task.attachmentUrl || "");
  const [contentHtml, setContentHtml] = useState(
    data.task.contentHtml || data.task.description || ""
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { startUpload, isUploading } = useUploadThing("taskAttachment");

  const [dueDate, setDueDate] = useState(
    data.task.dueDate ? new Date(data.task.dueDate).toISOString().split("T")[0] : ""
  );
  const [assigneeId, setAssigneeId] = useState(data.task.assigneeId || "");
  const [statusId, setStatusId] = useState(data.task.listId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveAttachmentConfirm, setShowRemoveAttachmentConfirm] = useState(false);
  const [error, setError] = useState("");

  const [prevDataListId, setPrevDataListId] = useState(data.task.listId);

  if (data.task.listId !== prevDataListId) {
    setPrevDataListId(data.task.listId);
    setStatusId(data.task.listId);
  }

  const rawComments: FeedItem[] = (data.comments || []).map((c: ServerComment) => ({
    ...c,
    feedType: "comment",
  }));
  const rawActivities: FeedItem[] = (data.activities || []).map((a: ServerActivity) => ({
    ...a,
    feedType: "activity",
  }));
  const combinedFeed: FeedItem[] = [...rawComments, ...rawActivities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const maxDateString = data.project.dueDate
    ? new Date(data.project.dueDate).toISOString().split("T")[0]
    : undefined;

  const handleClose = () => {
    onClose();
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let finalAttachmentUrl = attachmentUrl;

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

      await updateTask.mutateAsync({
        taskId,
        data: {
          title,
          contentHtml,
          description: plainTextDescription || null,
          attachmentUrl: finalAttachmentUrl,
          priority,
          dueDate,
          assigneeId,
          listId: statusId,
        },
      });

      setSelectedFile(null);
      setAttachmentUrl(finalAttachmentUrl);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to update task");
    }
  };

  const handleDeleteTask = () => {
    setShowDeleteConfirm(false);
    onClose();

    const queryKey = ["tasks", data.project.id];
    const previousTasks = queryClient.getQueryData(queryKey);

    queryClient.setQueryData(queryKey, (oldTasks: DbTask[] | undefined) => {
      if (!Array.isArray(oldTasks)) return oldTasks;
      return oldTasks.filter((t: DbTask) => t.id !== taskId);
    });

    let isUndone = false;

    const timerId = setTimeout(() => {
      if (!isUndone) {
        deleteTask.mutate(taskId, {
          onError: () => {
            queryClient.setQueryData(queryKey, previousTasks);
            showToast({ message: "Failed to delete task", type: "error" });
          },
        });
      }
    }, DEFAULT_TOAST_DURATION);

    showToast({
      message: "Task moved to trash",
      description: "Will be permanently deleted in 5 seconds.",
      action: {
        label: "Undo",
        onClick: () => {
          isUndone = true;
          clearTimeout(timerId);
          queryClient.setQueryData(queryKey, previousTasks);
          showToast({ message: "Task restored!", type: "success" });
        },
      },
    });
  };

  return (
    <>
      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title="Delete this task?"
        description="This action cannot be undone. All comments and activity logs will be permanently removed."
        confirmText="Delete Task"
        isLoading={deleteTask.isPending}
        variant="inner"
      />

      <ConfirmActionModal
        isOpen={showRemoveAttachmentConfirm}
        onClose={() => setShowRemoveAttachmentConfirm(false)}
        onConfirm={() => {
          setAttachmentUrl("");
          setShowRemoveAttachmentConfirm(false);
        }}
        title="Remove Attachment?"
        description="Are you sure you want to remove this file? You will need to upload it again if you change your mind."
        confirmText="Remove File"
        variant="inner"
      />

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 md:px-8 py-5 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-400 uppercase mb-1">
            {data.project.name}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold text-black bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-gray-300 w-full max-w-xl"
            placeholder="Task Title..."
          />
        </div>
        <div className="flex items-center gap-3">
          {canDeleteTask && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete Task"
            >
              <Trash2 size={20} />
            </button>
          )}
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-y-auto md:overflow-hidden flex-col md:flex-row">
        {/* LEFT COLUMN: EDIT FORM */}
        <div className="w-full md:w-3/5 p-4 md:p-8 overflow-visible md:overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 bg-white shrink-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}

          <form id="edit-task-form" onSubmit={handleSaveChanges} className="space-y-6">
            <div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                  Description/Task Details
                </label>
                {canEditTask ? (
                  <RichTextEditor
                    value={contentHtml}
                    onChange={setContentHtml}
                    placeholder="Add a more detailed description..."
                  />
                ) : (
                  <div
                    className="text-sm p-4 bg-gray-50 border border-gray-200 rounded-xl [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 space-y-2 text-black"
                    dangerouslySetInnerHTML={{
                      __html:
                        contentHtml || "<p class='text-gray-400 italic'>No details provided.</p>",
                    }}
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mt-2 mb-2 uppercase flex items-center gap-2">
                  <Paperclip size={14} /> Attachment
                </label>

                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl group">
                    <span className="text-sm font-medium text-blue-700 truncate pr-4">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : attachmentUrl ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl group">
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline truncate"
                    >
                      <Download size={16} className="flex-shrink-0" />
                      <span className="truncate">{getFileNameFromUrl(attachmentUrl)}</span>
                    </a>
                    {canEditTask && (
                      <button
                        type="button"
                        onClick={() => setShowRemoveAttachmentConfirm(true)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ) : canEditTask ? (
                  <label className="flex flex-col items-center justify-center w-full py-6 bg-gray-50 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Paperclip size={24} className="mb-2 text-gray-400" />
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
                ) : (
                  <div className="text-sm text-gray-400 italic p-3 bg-gray-50 rounded-xl border border-gray-100">
                    No file attached.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2">
                  <LayoutList size={14} /> Status
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black appearance-none cursor-pointer"
                >
                  {data.projectLists.map((list: DbList) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2">
                  <User size={14} /> Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black appearance-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {data.team.map((member: TeamMember) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2">
                  <Flag size={14} /> Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black appearance-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2">
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
            </div>

            {canEditTask && (
              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={updateTask.isPending || isUploading || !title.trim()}
                  className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {isUploading
                    ? "Uploading File..."
                    : updateTask.isPending
                      ? "Saving..."
                      : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* RIGHT COLUMN: ACTIVITY FEED */}
        <div className="w-full md:w-2/5 flex flex-col bg-[#F8F8F8] h-[600px] md:h-full shrink-0">
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
            <h3 className="font-bold text-black flex items-center gap-2">
              <Activity size={16} /> Activity & Comments
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {combinedFeed.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-10">No activity yet.</p>
            ) : (
              combinedFeed.map((item: FeedItem) => {
                const userName = item.user
                  ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() ||
                    "Unknown User"
                  : "Unknown User";
                const timeAgo = formatRelativeTime(item.createdAt);

                if (item.feedType === "comment") {
                  const isMyComment = currentUserId === item.user?.id;
                  const isEditing = editingCommentId === item.id;

                  return (
                    <div key={`comment-${item.id}`} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-black">{userName}</span>
                            <span className="text-xs text-gray-400">{timeAgo}</span>
                            {/* Edited Badge */}
                            {item.isEdited && !isEditing && (
                              <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">
                                (edited)
                              </span>
                            )}
                          </div>

                          {/* Edit Button for the owner */}
                          {isMyComment && !isEditing && (
                            <button
                              onClick={() => {
                                setEditingCommentId(item.id);
                                setEditingContent(item.content || "");
                              }}
                              className="text-gray-400 hover:text-black transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>

                        {/* ✅ Edit Mode vs View Mode */}
                        {isEditing ? (
                          <div className="mt-1 space-y-2">
                            <RichTextEditor
                              value={editingContent}
                              onChange={setEditingContent}
                              teamMembers={data.team}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="text-xs font-bold text-gray-500 hover:text-black px-3 py-1.5"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditSubmit(item.id)}
                                className="text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-md px-3 py-1.5"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="bg-white p-3 rounded-xl rounded-tl-none border border-gray-200 shadow-sm text-sm text-black [&_strong]:text-black [&_strong]:font-bold [&_p]:m-0"
                            dangerouslySetInnerHTML={{ __html: item.content || "" }}
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                if (item.feedType === "activity") {
                  return (
                    <div key={`activity-${item.id}`} className="flex gap-3 items-start">
                      <div className="mt-1 w-8 flex justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-black">{userName}</span>{" "}
                        {item.actionType === "created" && `added this task to ${data.project.name}`}
                        {item.actionType === "moved" && (
                          <>
                            {" "}
                            moved this from{" "}
                            <span className="font-medium text-black">{item.oldValue}</span> to{" "}
                            <span className="font-medium text-black">{item.newValue}</span>
                          </>
                        )}
                        {item.actionType === "assigned" && (
                          <>
                            {" "}
                            changed assignee from{" "}
                            <span className="font-medium text-black">{item.oldValue}</span> to{" "}
                            <span className="font-medium text-black">{item.newValue}</span>
                          </>
                        )}
                        {item.actionType === "updated_priority" && (
                          <>
                            {" "}
                            changed priority from{" "}
                            <span className="font-medium text-black capitalize">
                              {item.oldValue}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium text-black capitalize">
                              {item.newValue}
                            </span>
                          </>
                        )}
                        {item.actionType === "updated_dueDate" && (
                          <>
                            {" "}
                            changed the due date from{" "}
                            <span className="font-medium text-black">{item.oldValue}</span> to{" "}
                            <span className="font-medium text-black">{item.newValue}</span>
                          </>
                        )}
                        {item.actionType === "updated_title" && " updated the title"}
                        {item.actionType === "updated_description" && " updated the description"}
                        {item.actionType === "updated_attachment" && " updated the task attachment"}
                        <span className="text-xs text-gray-400 ml-2">{timeAgo}</span>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>

          <div className="mt-auto p-4 bg-white border-t border-gray-200 flex-shrink-0">
            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
              <div className="min-h-[80px]">
                <RichTextEditor
                  value={newComment}
                  onChange={setNewComment}
                  teamMembers={data.team}
                  placeholder="Write a comment... Type @ to mention someone!"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim() || newComment === "<p></p>"}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <MessageSquare size={14} /> Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
