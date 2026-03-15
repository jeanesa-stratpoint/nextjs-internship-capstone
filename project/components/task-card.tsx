"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/stores/board-store";
import {
  CheckCircle2,
  Clock,
  Circle,
  CheckCircle,
  MoreVertical,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TeamMember } from "./kanban-board";
import { useUIStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { useTaskMutations } from "@/hooks/use-tasks";
import ConfirmActionModal from "./modals/confirm-action-modal";

interface TaskCardProps {
  task: Task;
  projectId: string;
  projectName: string;
  columnName: string;
  projectTeam: TeamMember[];
}

const getColumnStyle = (name: string) => {
  if (name === "In Progress")
    return {
      icon: Clock,
      iconColor: "text-amber-500",
      avatarBg: "bg-[#FFA724]",
      avatarText: "text-[#FFDAA2]",
    };
  if (name === "Review")
    return {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      avatarBg: "bg-[#007B50]",
      avatarText: "text-[#B3D8B8]",
    };
  if (name === "Done")
    return {
      icon: CheckCircle,
      iconColor: "text-rose-500",
      avatarBg: "bg-[#FF8B81]",
      avatarText: "text-[#FFFFFF]",
    };
  return {
    icon: Circle,
    iconColor: "text-gray-400",
    avatarBg: "bg-[#7E7E7E]",
    avatarText: "text-[#BDBDBD]",
  };
};

const getPriorityStyle = (priority?: string | null) => {
  if (priority === "high") return "bg-[#FFD3D3] text-[#7B0002] border-[#7B0002]";
  if (priority === "low") return "bg-[#D3FFD8] text-[#007B50] border-[#007B50]";
  return "bg-[#D2E9FF] text-[#15538D] border-[#15538D]";
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
  columnName,
  projectTeam,
}: TaskCardProps) {
  const { openTaskDetailModal } = useUIStore();
  const { lists } = useBoardStore();
  const { deleteTask, moveTaskStatus } = useTaskMutations(projectId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };
  const colStyle = getColumnStyle(columnName);
  const StatusIcon = colStyle.icon;

  const assignee = projectTeam.find((member) => member.id === task.assigneeId);
  const initials = getInitials(assignee?.firstName, assignee?.lastName, assignee?.email);
  const fullName = assignee
    ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email
    : "Unassigned";

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    setShowDeleteConfirm(false);
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
        className="p-4 bg-gray-50 border-2 border-blue_munsell-500 border-dashed rounded-xl h-[100px] opacity-50"
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
        isLoading={deleteTask.isPending}
      />

      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => openTaskDetailModal(task.id)}
        className="p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-[16px] cursor-grab active:cursor-grabbing flex flex-col gap-2 relative group touch-none"
      >
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <StatusIcon size={12} className={colStyle.iconColor} />
            <span className="truncate max-w-[150px]">{projectName}</span>
          </div>

          {/* ✨ UPDATED: Smooth sliding avatar container ✨ */}
          <div className="relative flex items-center justify-end h-6 min-w-[24px]">
            {/* Avatar - physically slides left when hovered OR when menu is open */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${colStyle.avatarBg} ${colStyle.avatarText} transition-transform duration-200 z-10 ${
                isMenuOpen ? "-translate-x-7" : "group-hover:-translate-x-7"
              }`}
              title={fullName}
            >
              {initials}
            </div>

            {/* Menu Button - fades in on hover, absolute positioned to not break layout */}
            <div
              className={`absolute right-0 top-0 transition-opacity duration-200 z-20 ${
                isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setShowMoveMenu(false);
                }}
                className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {!showMoveMenu ? (
                    <>
                      <button
                        onClick={() => setShowMoveMenu(true)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ArrowRightLeft size={14} /> Move to column...
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                      >
                        <Trash2 size={14} /> Delete from project
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase">
                        Select List
                      </div>
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => handleMoveToColumn(list.id)}
                          disabled={list.id === task.listId}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 truncate"
                        >
                          {list.name} {list.id === task.listId && "(Current)"}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <h4 className="text-sm font-bold text-black">{task.title}</h4>

        <div className="flex items-center justify-between mt-3">
          <span
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize border ${getPriorityStyle(task.priority)}`}
          >
            {task.priority || "Medium"}
          </span>
          <span className="text-[10px] font-medium text-gray-400">
            Created {formatDate(task.createdAt)}
          </span>
        </div>
      </div>
    </>
  );
}
