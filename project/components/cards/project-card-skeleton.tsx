"use client";

export default function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col h-[220px] relative overflow-hidden animate-pulse">
      {/* Left Color Bar Skeleton */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-200"></div>

      <div className="pl-2 flex-1 flex flex-col">
        {/* Title & Badge */}
        <div className="flex justify-between items-start mb-6 gap-2 pr-6">
          <div className="h-6 w-3/4 bg-gray-200 rounded-md"></div>
          <div className="h-5 w-16 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Meta text */}
        <div className="mb-8 space-y-2">
          <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-3 w-2/5 bg-gray-200 rounded"></div>
          <div className="h-3 w-1/3 bg-gray-200 rounded mt-3"></div>
        </div>

        {/* Bottom Progress */}
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
            <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5"></div>
        </div>
      </div>
    </div>
  );
}
