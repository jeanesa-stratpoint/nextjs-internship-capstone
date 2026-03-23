import { Search } from "lucide-react";
import ProjectCardSkeleton from "@/components/cards/project-card-skeleton";

export default function ProjectsLoading() {
  return (
    <div className="space-y-8 text-black h-full flex flex-col animate-in fade-in duration-300">
      {/* TOP ROW SKELETON */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div className="space-y-2 w-full lg:w-auto">
          <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-8 w-40 bg-gray-300 rounded-md animate-pulse"></div>
        </div>

        {/* Search & Filter Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto opacity-50 pointer-events-none">
          <div className="relative w-full sm:flex-1 lg:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <div className="w-full h-[42px] bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="h-[42px] w-full sm:w-[100px] bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* QUICK ACTIONS SKELETON */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="flex gap-3">
          <div className="h-[38px] w-[140px] bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-[38px] w-[140px] bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* ACTIVE PROJECTS GRID SKELETON */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-300 rounded-md animate-pulse"></div>
        </div>

        {/* Render 6 skeleton cards by default */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
