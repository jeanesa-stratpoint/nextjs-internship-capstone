"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StoreList, StoreTask } from "@/stores/board-store";
import {
  Circle,
  MoreVertical,
  Trash2,
  ArrowRightLeft,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TeamMember } from "@/types/index";
import { useUIStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { useTaskMutations } from "@/hooks/use-tasks";
import { BoardPermissions } from "../kanban-board";
import ConfirmActionModal from "../modals/confirm-action-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useToastStore, DEFAULT_TOAST_DURATION } from "@/stores/toast-store";

interface TaskCardProps {
  task: StoreTask;
  projectId: string;
  projectName: string;
  column: StoreList;
  projectTeam: TeamMember[];
  permissions: BoardPermissions;
}

const getColumnStyle = (column: StoreList) => {
  let hexColor = column.color || "#6B7280";
  let avatarBg = hexColor;
  let avatarText = "#FFFFFF";

  if (column.name === "In Progress" && hexColor === "#6B7280") {
    hexColor = "#FFA724";
    avatarBg = "#FFA724";
    avatarText = "#FFDAA2";
  } else if (column.name === "Review" && hexColor === "#6B7280") {
    hexColor = "#007B50";
    avatarBg = "#007B50";
    avatarText = "#B3D8B8";
  } else if (column.name === "Done" && hexColor === "#6B7280") {
    hexColor = "#FF8B81";
    avatarBg = "#FF8B81";
    avatarText = "#FFFFFF";
  }

  return { icon: Circle, hexColor, avatarBg, avatarText };
};

const getPriorityStyle = (priority?: string | null) => {
  if (priority === "high")
    return "bg-[#FFD3D3] text-[#7B0002] border-[#7B0002] dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
  if (priority === "low")
    return "bg-[#D3FFD8] text-[#007B50] border-[#007B50] dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
  return "bg-[#D2E9FF] text-[#15538D] border-[#15538D] dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
};

const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  if (lastName) return lastName.substring(0, 2).toUpperCase();
  if (email) return email.substring(0, 2).toUpperCase();
  return "UN";
};

export default function TaskCard({
  task,
  projectId,
  projectName,
  column,
  projectTeam,
  permissions,
}: TaskCardProps) {
  const { openTaskDetailModal } = useUIStore();
  const { lists } = useBoardStore();
  const { deleteTask, moveTaskStatus } = useTaskMutations(projectId);

  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setShowMoveMenu(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("pointerdown", handleClickOutside, true);
      document.addEventListener("mousedown", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isMenuOpen]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
    disabled: !permissions.canEditTask,
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };
  const colStyle = getColumnStyle(column);
  const StatusIcon = colStyle.icon;

  const assignee = projectTeam.find((member) => member.id === task.assigneeId);
  const initials = getInitials(assignee?.firstName, assignee?.lastName, assignee?.email);
  const fullName = assignee
    ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email
    : "Unassigned";

  const endListId = lists.length > 0 ? lists[lists.length - 1].id : null;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
    task.listId !== endListId;

  const hasMenuAccess = permissions.canEditTask || permissions.canDeleteTask;

  const handleDelete = () => {
    setShowDeleteConfirm(false);

    const queryKey = ["tasks", projectId];
    const previousTasks = queryClient.getQueryData(queryKey);

    queryClient.setQueryData(queryKey, (oldTasks: StoreTask[] | undefined) => {
      if (!Array.isArray(oldTasks)) return oldTasks;
      return oldTasks.filter((t) => t.id !== task.id);
    });

    let isUndone = false;

    const timerId = setTimeout(() => {
      if (!isUndone) {
        deleteTask.mutate(task.id, {
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

  const handleMoveToColumn = async (newListId: string) => {
    setIsMenuOpen(false);
    setShowMoveMenu(false);
    if (task.listId !== newListId) {
      await moveTaskStatus.mutateAsync({ taskId: task.id, newListId });
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-4 bg-gray-50 dark:bg-zinc-900 border-2 border-blue_munsell-500 dark:border-blue-500 border-dashed rounded-xl h-[100px] opacity-50"
      />
    );
  }

  return (
    <>
      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmText="Delete"
        isLoading={false}
      />

      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => openTaskDetailModal(task.id)}
        className={`p-4 bg-white dark:bg-zinc-900 border ${isOverdue ? "border-red-300 dark:border-red-500/30 shadow-sm shadow-red-100 dark:shadow-none" : "border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md dark:hover:border-zinc-600"} rounded-[16px] cursor-grab active:cursor-grabbing flex flex-col gap-2 relative group touch-none`}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">
            <StatusIcon size={12} style={{ color: colStyle.hexColor }} />
            <span className="truncate max-w-[150px]">{projectName}</span>
          </div>

          <div className="relative flex items-center justify-end h-6 min-w-[24px]">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform duration-200 z-10 ${
                hasMenuAccess ? (isMenuOpen ? "-translate-x-7" : "group-hover:-translate-x-7") : ""
              }`}
              style={{ backgroundColor: colStyle.avatarBg, color: colStyle.avatarText }}
              title={fullName}
            >
              {initials}
            </div>

            {hasMenuAccess && (
              <div
                ref={menuRef}
                className={`absolute right-0 top-0 transition-opacity duration-200 z-20 ${
                  isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(!isMenuOpen);
                    setShowMoveMenu(false);
                  }}
                  className="p-1 text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 py-2 z-50">
                    {!showMoveMenu ? (
                      <>
                        {permissions.canEditTask && (
                          <button
                            onClick={() => setShowMoveMenu(true)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <ArrowRightLeft size={14} /> Move to column...
                          </button>
                        )}
                        {permissions.canEditTask && permissions.canDeleteTask && (
                          <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1"></div>
                        )}
                        {permissions.canDeleteTask && (
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              setShowDeleteConfirm(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 font-medium"
                          >
                            <Trash2 size={14} /> Delete from project
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-1.5 text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase">
                          Select List
                        </div>
                        {lists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => handleMoveToColumn(list.id)}
                            disabled={list.id === task.listId}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-zinc-900 truncate"
                          >
                            {list.name} {list.id === task.listId && "(Current)"}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4
            className={`text-sm font-bold ${isOverdue ? "text-red-700 dark:text-red-400" : "text-black dark:text-zinc-100"}`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-[10px] font-bold rounded-xl capitalize border ${getPriorityStyle(task.priority)}`}
            >
              {task.priority || "Medium"}
            </span>
            <div
              className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500"
              title={`${task.commentCount || 0} comments`}
            >
              <MessageSquare size={12} />
              <span className="text-[10px] font-bold">{task.commentCount || 0}</span>
            </div>
          </div>

          {isOverdue ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">
              <AlertCircle size={10} /> Overdue
            </span>
          ) : (
            <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
