"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/stores/board-store";
import { CheckCircle2, Clock, Circle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TeamMember } from "./kanban-board";
import { useUIStore } from "@/stores/ui-store";

interface TaskCardProps {
  task: Task;
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

export default function TaskCard({ task, projectName, columnName, projectTeam }: TaskCardProps) {
  const { openTaskDetailModal } = useUIStore();
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };
  const colStyle = getColumnStyle(columnName);
  const StatusIcon = colStyle.icon;

  const assignee = projectTeam.find((member) => member.id === task.assigneeId);

  // Update it to use the new exact properties:
  const initials = getInitials(assignee?.firstName, assignee?.lastName, assignee?.email);
  const fullName = assignee
    ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email
    : "Unassigned";

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

        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${colStyle.avatarBg} ${colStyle.avatarText}`}
          title={fullName}
        >
          {initials}
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
  );
}
