import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries";
import { hasSystemPermission } from "@/lib/rbac";
import { formatHeaderDate, getGreeting } from "@/lib/utils";
import { TrendingUp, Users, CheckCircle, ListTodo, LucideIcon } from "lucide-react";
import QuickActions from "@/components/quick-actions";
import ProjectCard from "@/components/cards/project-card";
import MyTasksWidget from "@/components/my-tasks-widget";
import SearchFilterBar from "@/components/search-filter-bar";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q.toLowerCase() : "";
  const priorityFilter =
    typeof resolvedParams.priority === "string" ? resolvedParams.priority : "all";
  const taskStatusFilter =
    typeof resolvedParams.taskStatus === "string" ? resolvedParams.taskStatus : "all";

  const [canCreateProject, canInviteMember] = await Promise.all([
    hasSystemPermission(userId, "project:create"),
    hasSystemPermission(userId, "project-invite:create"),
  ]);

  const canDeleteProject = await hasSystemPermission(userId, "project:delete");

  const currentUser = await queries.users.getById(userId);
  const stats = await queries.analytics.getDashboardStats(userId);

  const filteredRecentProjects = stats.allProjects
    .filter((p) => p.project.name.toLowerCase().includes(q))
    .slice(0, 3);

  const filteredMyTasks = stats.myTasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(q);
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchesStatus = taskStatusFilter === "all" || t.listStage === taskStatusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const greeting = getGreeting();

  return (
    <div className="space-y-10 text-black flex flex-col pb-10 mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6">
        {/* Top Row: Greeting & Search/Filter */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-2">{formatHeaderDate()}</p>
            <h1 className="text-4xl font-bold">
              {greeting}, {currentUser?.firstName || "User"}
            </h1>
          </div>

          <SearchFilterBar
            placeholder="Search projects & tasks..."
            filters={[
              {
                id: "priority",
                label: "Task Priority",
                options: [
                  { label: "All Priorities", value: "all" },
                  { label: "High", value: "high" },
                  { label: "Medium", value: "medium" },
                  { label: "Low", value: "low" },
                ],
              },
              {
                id: "taskStatus",
                label: "Task Status",
                options: [
                  { label: "All Statuses", value: "all" },
                  { label: "Unstarted", value: "unstarted" },
                  { label: "In Progress", value: "in_progress" },
                  { label: "Completed", value: "completed" },
                ],
              },
            ]}
          />
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
      {(filteredRecentProjects.length > 0 || q) && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
          {filteredRecentProjects.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-8 text-center bg-gray-50/50">
              <p className="text-gray-400 text-sm font-medium">No projects match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRecentProjects.map(({ project, metrics, role }) => (
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
          )}
        </div>
      )}

      {/* MY TASKS WIDGET */}
      <div className="mb-20">
        <h2 className="text-xl font-bold mb-6">My Tasks</h2>
        <MyTasksWidget tasks={filteredMyTasks} />
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
