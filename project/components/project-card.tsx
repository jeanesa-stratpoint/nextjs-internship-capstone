"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { DbProject } from "@/types/index";

export default function ProjectCard({
  project,
  index,
  isActive,
  memberCount,
  taskCount,
  completedTaskCount,
  ownerName,
  isOwner,
}: {
  project: DbProject;
  index: number;
  isActive: boolean;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  ownerName: string;
  isOwner: boolean;
}) {
  const colors = [
    "bg-red-100",
    "bg-indigo-100",
    "bg-blue-100",
    "bg-amber-100",
    "bg-green-100",
    "bg-rose-100",
  ];
  const progressColors = [
    "bg-red-400",
    "bg-indigo-400",
    "bg-blue-400",
    "bg-amber-400",
    "bg-green-400",
    "bg-rose-400",
  ];
  const colorIndex = index % colors.length;

  const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  let daysLeftText = "No deadline";
  if (project.dueDate) {
    const today = new Date();
    const due = new Date(project.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      daysLeftText = "Overdue";
    } else if (diffDays === 0) {
      daysLeftText = "Due today";
    } else {
      daysLeftText = `${diffDays} days left`;
    }
  }

  return (
    <div className="relative group block h-full">
      <Link
        href={`/projects/${project.id}`}
        className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden"
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors[colorIndex]}`}></div>

        <div className="pl-2 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-6 gap-2">
            <h3 className="text-lg font-bold text-black line-clamp-1 pr-6">{project.name}</h3>

            <span
              className={`text-xs font-bold shrink-0 ${daysLeftText === "Overdue" ? "text-red-500" : "text-black"}`}
            >
              {isActive ? daysLeftText : "Archived"}
            </span>
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-400 mb-1">
              Created on <span className="font-bold">{formatDate(project.createdAt)}</span>
            </p>

            {project.dueDate && (
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                Due on <span className="font-bold">{formatDate(project.dueDate)}</span>
              </p>
            )}

            <p className="text-xs text-gray-400 font-medium mt-3">
              Owned by{" "}
              <span className="text-gray-400 font-bold">{isOwner ? "You" : ownerName}</span>
            </p>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-black">{memberCount} members</span>
              <span className="text-xs font-bold text-black">
                {taskCount} tasks ({progress}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColors[colorIndex]}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Link>

      <button
        className="absolute top-5 right-4 p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 z-10"
        onClick={(e) => {
          e.preventDefault();
          console.log("Edit menu clicked for:", project.id);
        }}
      >
        <MoreHorizontal size={20} />
      </button>
    </div>
  );
}
