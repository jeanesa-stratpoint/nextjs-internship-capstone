"use client";

import Link from "next/link";
import ConfirmActionModal from "./modals/confirm-action-modal";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal, CheckCircle2, PauseCircle, Trash2, Edit } from "lucide-react";
import { DbProject } from "@/types/index";
import {
  updateProjectStatusAction,
  markProjectCompletedAction,
  deleteProjectAction,
} from "@/actions/projects";

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "completed") {
    return (
      <span className="px-2.5 py-1 bg-lime-200 text-lime-700 text-[10px] font-bold rounded-xl uppercase">
        Completed
      </span>
    );
  }
  if (status === "on-hold") {
    return (
      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-xl uppercase">
        On Hold
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-xl uppercase">
      Active
    </span>
  );
};

export default function ProjectCard({
  project,
  index,
  memberCount,
  taskCount,
  completedTaskCount,
  ownerName,
  isOwner,
  canEdit,
  canDelete,
}: {
  project: DbProject;
  index: number;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  ownerName: string;
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleStatusChange = async (status: "active" | "on-hold") => {
    setIsLoading(true);
    await updateProjectStatusAction(project.id, status);
    setIsLoading(false);
    setIsMenuOpen(false);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    await markProjectCompletedAction(project.id);
    setIsLoading(false);
    setShowCompleteModal(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    await deleteProjectAction(project.id);
    setIsLoading(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <ConfirmActionModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleComplete}
        title="Mark Project as Completed?"
        description="Are you sure you would like to mark this as completed? All remaining tasks will be moved to the end of the list for this project."
        confirmText="Complete Project"
        isDestructive={false}
        isLoading={isLoading}
      />
      <ConfirmActionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will erase all associated tasks and lists.`}
        confirmText="Delete Project"
        isLoading={isLoading}
      />

      <div className="relative group block h-full">
        <Link
          href={`/projects/${project.id}`}
          className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors[colorIndex]}`}></div>

          <div className="pl-2 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6 gap-2 pr-6">
              <h3 className="text-lg font-bold text-black line-clamp-1">{project.name}</h3>
              <StatusBadge status={project.status} />
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

        {canEdit && (
          <div className="absolute top-5 right-4 z-20">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-1.5 rounded-full transition-all ${isMenuOpen ? "opacity-100 bg-gray-100 text-black" : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black hover:bg-gray-100"}`}
            >
              <MoreHorizontal size={20} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={14} /> Edit Details
                  </button>
                  {project.status !== "completed" && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowCompleteModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 font-medium"
                    >
                      <CheckCircle2 size={14} /> Mark Completed
                    </button>
                  )}
                  {project.status === "active" ? (
                    <button
                      onClick={() => handleStatusChange("on-hold")}
                      className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 font-medium"
                    >
                      <PauseCircle size={14} /> Mark On-Hold
                    </button>
                  ) : project.status === "on-hold" ? (
                    <button
                      onClick={() => handleStatusChange("active")}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"
                    >
                      <CheckCircle2 size={14} /> Resume Project
                    </button>
                  ) : null}
                  <div className="h-px bg-gray-100 my-1"></div>
                  {canDelete && (
                    <>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowDeleteModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                      >
                        <Trash2 size={14} /> Delete Project
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
