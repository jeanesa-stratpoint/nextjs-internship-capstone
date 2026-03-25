export default function CalendarLoading() {
  return (
    <div className="space-y-4 text-black animate-in fade-in duration-300">
      {/* --- Header Skeleton --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-3 w-full sm:w-1/2">
          {/* Date */}
          <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          {/* Title */}
          <div className="h-8 w-48 bg-gray-300 rounded-md animate-pulse"></div>
          {/* Subtitle */}
          <div className="h-4 w-72 bg-gray-200 rounded-md animate-pulse mt-2"></div>
        </div>

        {/* Create Event Button Skeleton */}
        <div className="h-10 w-32 bg-gray-300 rounded-xl animate-pulse"></div>
      </div>

      {/* --- Calendar Widget Skeleton --- */}
      <div className="h-[720px] bg-gray-800 rounded-[20px] p-6 border border-gray-200 shadow-sm flex flex-col">
        {/* Legend Skeleton */}
        <div className="flex items-center gap-4 mb-4 px-2">
          <div className="h-4 w-16 bg-blue-100 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-rose-100 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-indigo-100 rounded animate-pulse"></div>
        </div>

        {/* Custom Toolbar Skeleton */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Nav Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="h-9 w-9 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="h-9 w-16 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="h-9 w-9 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>

          {/* Center: Month/Year Label */}
          <div className="flex-1 flex justify-center">
            <div className="h-6 w-40 bg-gray-300 rounded-md animate-pulse"></div>
          </div>

          {/* Right: View Toggles */}
          <div className="hidden sm:flex space-x-2 bg-gray-100 p-1 rounded-2xl">
            <div className="h-8 w-16 bg-white rounded-xl shadow-sm"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="flex-1 w-full border border-gray-100 rounded-lg flex flex-col overflow-hidden">
          {/* Days Header Row */}
          <div className="h-12 border-b border-gray-100 flex">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-gray-100 last:border-r-0 bg-gray-50/50"
              ></div>
            ))}
          </div>
          {/* Calendar Body Area */}
          <div className="flex-1 bg-gray-50/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
