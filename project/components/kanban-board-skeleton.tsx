"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";

export default function KanbanBoardSkeleton() {
  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Header Area Skeleton */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 text-gray-300">
            <ArrowLeft size={24} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Actions & Team Skeleton */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#F8F8F8] bg-gray-200 animate-pulse z-10"
              ></div>
            ))}
          </div>
          <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="h-4 w-3/4 max-w-2xl bg-gray-200 rounded-md mb-8 ml-14 animate-pulse"></div>

      {/* Board Columns Skeleton */}
      <div className="flex-1 overflow-hidden ml-14 flex gap-6 overflow-x-auto pb-4 items-start">
        {[1, 2, 3, 4].map((colIndex) => (
          <div
            key={colIndex}
            className="flex-shrink-0 w-[85vw] max-w-[320px] sm:w-[320px] bg-[#F0F0F0]/50 border border-gray-200 rounded-[20px] flex flex-col h-full max-h-[800px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300 animate-pulse"></div>
                <div className="h-5 w-24 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="h-4 w-6 bg-gray-200 rounded-md animate-pulse ml-1"></div>
              </div>
              <MoreHorizontal size={18} className="text-gray-300" />
            </div>

            {/* Task Cards Skeleton */}
            <div className="flex-1 p-3 space-y-3">
              {/* number of skeleton tasks per column */}
              {[...Array(colIndex === 2 ? 3 : colIndex === 4 ? 1 : 2)].map((_, taskIndex) => (
                <div
                  key={taskIndex}
                  className="p-4 bg-white border border-gray-100 rounded-[16px] shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-4 w-full bg-gray-300 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                    <div className="h-5 w-16 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Button Skeleton */}
            <div className="p-3 mt-auto border-t border-gray-200/50">
              <div className="h-10 w-full bg-gray-200/50 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
