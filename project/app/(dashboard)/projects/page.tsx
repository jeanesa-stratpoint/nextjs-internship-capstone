import { Search, Filter } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatHeaderDate } from "@/lib/utils";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries";
import QuickActions from "@/components/quick-actions";
import ProjectCard from "@/components/cards/project-card";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const canCreateProject = await hasSystemPermission(userId, "project:create");
  const canEditProject = await hasSystemPermission(userId, "project:edit");
  const canDeleteProject = await hasSystemPermission(userId, "project:delete");
  const canInviteMember = await hasSystemPermission(userId, "project-invite:create");
  const canCreateTask = await hasSystemPermission(userId, "task:create");
  const canEditTask = await hasSystemPermission(userId, "task:edit");
  const canDeleteTask = await hasSystemPermission(userId, "task:delete");
  const projectsWithMetrics = await queries.projects.getProjectsWithMetrics(userId);
  const currentDate = formatHeaderDate();
  const activeProjects = projectsWithMetrics.filter((p) => p.project.status === "active");
  const onHoldProjects = projectsWithMetrics.filter((p) => p.project.status === "on-hold");
  const completedProjects = projectsWithMetrics.filter((p) => p.project.status === "completed");

  const renderProjectGrid = (projects: typeof projectsWithMetrics, emptyText: string) => {
    if (projects.length === 0)
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-8 text-center bg-gray-50/50">
          <p className="text-gray-400 text-sm font-medium">{emptyText}</p>
        </div>
      );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map(({ project, metrics, role }, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            memberCount={metrics.memberCount}
            taskCount={metrics.taskCount}
            completedTaskCount={metrics.completedTaskCount}
            ownerName={metrics.ownerName}
            isOwner={metrics.isOwner}
            canEdit={canEditProject}
            canDelete={canDeleteProject}
            projectRole={role}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 text-black h-full flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* TOP ROW */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:flex-1 lg:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search (e.g. Projects, Tasks...)"
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400 text-black"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-200 transition-colors w-full sm:w-auto">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <p className="text-gray-600 text-sm">Manage and organize your team projects</p>
        <QuickActions
          canCreateProject={canCreateProject}
          canInviteMember={canInviteMember}
          canCreateTask={canCreateTask}
          canEditTask={canEditTask}
          canDeleteTask={canDeleteTask}
          userProjects={projectsWithMetrics.map((p) => p.project)}
        />
      </div>

      {/* ACTIVE PROJECTS */}
      <div className="pt-2 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-200"></div> Active Projects (
          {activeProjects.length})
        </h2>
        {renderProjectGrid(activeProjects, "No active projects. Create one to get started!")}
      </div>

      {/* ON-HOLD PROJECTS */}
      {onHoldProjects.length > 0 && (
        <div className="pt-2 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> On Hold (
            {onHoldProjects.length})
          </h2>
          {renderProjectGrid(onHoldProjects, "No projects on hold.")}
        </div>
      )}

      {/* COMPLETED PROJECTS */}
      <div className="pt-2 pb-12 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-lime-400"></div> Completed (
          {completedProjects.length})
        </h2>
        {renderProjectGrid(completedProjects, "No completed projects yet.")}
      </div>
    </div>
  );
}
