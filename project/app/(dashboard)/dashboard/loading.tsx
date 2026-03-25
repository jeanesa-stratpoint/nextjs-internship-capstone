export default function DashboardLoading() {
  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto flex flex-col pb-10 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="flex flex-col gap-6">
        {/* Top Row */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            {/* Date */}
            <div className="h-4 w-32 bg-gray-200 rounded-md mb-3"></div>
            {/* Greeting */}
            <div className="h-10 w-64 sm:w-96 bg-gray-200 rounded-lg"></div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
            {/* Search Bar */}
            <div className="h-[44px] w-full sm:w-[320px] bg-gray-100 rounded-full"></div>
            {/* Filter Button */}
            <div className="h-[44px] w-[100px] bg-gray-100 rounded-full hidden sm:block"></div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          {/* Subtitle */}
          <div className="h-5 w-72 bg-gray-100 rounded-md"></div>
          {/* Quick Actions */}
          <div className="h-10 w-48 bg-gray-100 rounded-lg hidden sm:block"></div>
        </div>
      </div>

      {/* STATS ROW SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-[24px] p-6 border border-gray-100 h-36 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Left Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-100"></div>

            {/* Title & Icon */}
            <div className="pl-3 flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
            </div>

            {/* Value & Badge */}
            <div className="pl-3 flex items-end justify-between mt-auto">
              <div className="h-12 w-16 bg-gray-200 rounded-lg"></div>
              <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT PROJECTS SKELETON */}
      <div>
        <div className="h-7 w-40 bg-gray-200 rounded-md mb-5"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] p-6 border border-gray-100 h-[220px] flex flex-col justify-between"
            >
              {/* Project Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-6 w-48 bg-gray-200 rounded-md mb-2"></div>
                  <div className="h-4 w-32 bg-gray-100 rounded-md"></div>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
              </div>

              {/* Project Footer Area */}
              <div className="mt-auto border-t border-gray-50 pt-4">
                <div className="flex justify-between mb-3">
                  <div className="h-4 w-20 bg-gray-100 rounded-md"></div>
                  <div className="h-4 w-20 bg-gray-100 rounded-md"></div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MY TASKS WIDGET SKELETON */}
      <div className="mb-20">
        <div className="h-7 w-32 bg-gray-200 rounded-md mb-6"></div>
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 min-h-[400px]">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-100 pb-3 mb-6">
            <div className="h-5 w-16 bg-gray-200 rounded-md"></div>
            <div className="h-5 w-16 bg-gray-100 rounded-md"></div>
            <div className="h-5 w-16 bg-gray-100 rounded-md"></div>
          </div>

          {/* Task Rows */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  <div className="h-5 w-48 sm:w-64 bg-gray-200 rounded-md"></div>
                  <div className="h-5 w-24 bg-gray-100 rounded-md hidden sm:block"></div>
                </div>
                <div className="h-4 w-20 bg-gray-100 rounded-md ml-4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
