"use client";

import { useState } from "react";
import { Circle, CheckCircle2, AlertCircle } from "lucide-react";
import { format, startOfDay } from "date-fns";
import Link from "next/link";

interface UserTask {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: string | null;
  listStage: string | null;
  projectId: string;
  projectName: string;
}

export default function MyTasksWidget({ tasks }: { tasks: UserTask[] }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "overdue" | "completed">("upcoming");

  const today = startOfDay(new Date());

  const upcomingTasks = tasks.filter(
    (t) => t.listStage !== "completed" && (!t.dueDate || startOfDay(new Date(t.dueDate)) >= today)
  );
  const overdueTasks = tasks.filter(
    (t) => t.listStage !== "completed" && t.dueDate && startOfDay(new Date(t.dueDate)) < today
  );
  const completedTasks = tasks.filter((t) => t.listStage === "completed");

  const displayTasks =
    activeTab === "upcoming"
      ? upcomingTasks
      : activeTab === "overdue"
        ? overdueTasks
        : completedTasks;

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 md:p-8 flex-1 min-h-[400px]">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-100 mb-6">
        {(["upcoming", "overdue", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold capitalize relative transition-colors ${
              activeTab === tab ? "text-black" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {displayTasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No {activeTab} tasks found.
          </div>
        ) : (
          displayTasks.map((task) => (
            <Link
              href={`/projects/${task.projectId}`}
              key={task.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 group"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 overflow-hidden">
                {activeTab === "completed" ? (
                  <CheckCircle2 size={18} className="text-gray-300 shrink-0" />
                ) : activeTab === "overdue" ? (
                  <AlertCircle size={18} className="text-red-500 shrink-0" />
                ) : (
                  <Circle
                    size={18}
                    className="text-gray-300 shrink-0 group-hover:text-blue-400 transition-colors"
                  />
                )}

                <span
                  className={`text-sm font-bold truncate ${activeTab === "completed" ? "text-gray-400 line-through" : "text-black"}`}
                >
                  {task.title}
                </span>

                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase truncate max-w-[140px]">
                  {task.projectName}
                </span>
              </div>

              <div className="text-xs font-semibold text-gray-400 whitespace-nowrap ml-4">
                {task.dueDate ? format(new Date(task.dueDate), "MMM d - MMM yy") : "No date"}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
