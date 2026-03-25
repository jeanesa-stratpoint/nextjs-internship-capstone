import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries";
import { hasSystemPermission } from "@/lib/rbac";
import { formatHeaderDate, getGreeting } from "@/lib/utils";
import { TrendingUp, Users, CheckCircle, ListTodo, Search, Filter, LucideIcon } from "lucide-react";
import QuickActions from "@/components/quick-actions";
import ProjectCard from "@/components/cards/project-card";
import MyTasksWidget from "@/components/my-tasks-widget";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [canCreateProject, canInviteMember, canDeleteProject] = await Promise.all([
    hasSystemPermission(userId, "project:create"),
    hasSystemPermission(userId, "project-invite:create"),
    hasSystemPermission(userId, "project:delete"),
  ]);

  const currentUser = await queries.users.getById(userId);
  const stats = await queries.analytics.getDashboardStats(userId);

  const greeting = getGreeting();

  return (
    <div className="space-y-10 text-black flex flex-col pb-10 mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col gap-6">
        {/* Top Row: Greeting & Search/Filter */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-2">{formatHeaderDate()}</p>
            <h1 className="text-4xl font-bold">
              {greeting}, {currentUser?.firstName || "User"}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search (e.g. Projects, Tasks...)"
                className="w-full pl-11 pr-4 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:text-black hover:bg-gray-200 transition-colors">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Bottom Row: Subtitle & Quick Actions */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <p className="text-gray-500 text-sm font-medium">
            Here&apos;s an overview of your projects and tasks.
          </p>

          <div className="w-full xl:w-auto">
            <QuickActions
              canCreateProject={canCreateProject}
              canInviteMember={canInviteMember}
              userProjects={stats.recentProjects.map((p) => p.project)}
            />
          </div>
        </div>
      </div>

      {/* STATS ROW WITH REAL DATA BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Projects"
          value={stats.activeProjectsCount}
          badge={stats.projectGrowth}
          icon={TrendingUp}
        />
        <StatCard
          title="Team Members"
          value={stats.teamCount}
          badge={stats.activeTeamPercentage}
          icon={Users}
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasksCount}
          badge={stats.completedGrowth}
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasksCount}
          badge={`${stats.dueThisWeekCount} due soon`}
          icon={ListTodo}
          isNegativeBadge={stats.dueThisWeekCount > 0}
        />
      </div>

      {/* RECENT PROJECTS */}
      {stats.recentProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {stats.recentProjects.map(({ project, metrics, role }) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={0}
                memberCount={metrics.memberCount}
                taskCount={metrics.taskCount}
                completedTaskCount={metrics.completedTaskCount}
                ownerName={metrics.ownerName}
                isOwner={metrics.isOwner}
                canDelete={canDeleteProject}
                projectRole={role}
              />
            ))}
          </div>
        </div>
      )}

      {/* MY TASKS WIDGET */}
      <div className="mb-20">
        <h2 className="text-xl font-bold mb-6">My Tasks</h2>
        <MyTasksWidget tasks={stats.myTasks} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  badge,
  icon: Icon,
  isNegativeBadge = false,
}: {
  title: string;
  value: number;
  badge: string;
  icon: LucideIcon;
  isNegativeBadge?: boolean;
}) {
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between h-36 transition-colors duration-300 hover:border-orange-300">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-100"></div>

      <div className="pl-3 flex items-center gap-3 text-gray-500 mb-2">
        <Icon size={20} />
        <span className="text-sm font-bold">{title}</span>
      </div>

      <div className="pl-3 flex items-end justify-between mt-auto">
        <span className="text-[52px] leading-none font-bold text-black tracking-tight">
          {value}
        </span>

        <span
          className={`px-2.5 py-1 mb-1 text-[11px] font-bold rounded-full ${
            isNegativeBadge ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          }`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}
