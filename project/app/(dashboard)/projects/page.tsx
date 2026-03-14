import { Search, Filter } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatHeaderDate } from "@/lib/utils";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries";
import QuickActions from "@/components/quick-actions";
import ProjectCard from "@/components/project-card";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const canCreateProject = await hasSystemPermission(userId, "project:create");
  const canInviteMember = await hasSystemPermission(userId, "project-invite:create");
  const projectsWithMetrics = await queries.projects.getProjectsWithMetrics(userId);
  const currentDate = formatHeaderDate();
  const activeProjects = projectsWithMetrics;

  return (
    <div className="space-y-8 text-black h-full flex flex-col">
      {/* TOP ROW */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search (e.g. Projects, Tasks...)"
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400 text-black"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-200 transition-colors">
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
          userProjects={projectsWithMetrics.map((p) => ({
            id: p.project.id,
            name: p.project.name,
          }))}
        />
      </div>

      {/* ACTIVE PROJECTS GRID */}
      <div className="pt-2">
        <h2 className="text-lg font-bold mb-4">Active Projects ({activeProjects.length})</h2>

        {activeProjects.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-12 text-center flex flex-col items-center justify-center">
            <p className="text-gray-500 font-medium mb-4">
              No projects yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeProjects.map(({ project, metrics }, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                isActive={true}
                memberCount={metrics.memberCount}
                taskCount={metrics.taskCount}
                completedTaskCount={metrics.completedTaskCount}
                ownerName={metrics.ownerName}
                isOwner={metrics.isOwner}
              />
            ))}
          </div>
        )}
      </div>

      {/* ARCHIVE GRID */}
      <div className="pt-6 pb-12">
        <h2 className="text-lg font-bold mb-4">Archive</h2>
        <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-8 text-center bg-gray-50/50">
          <p className="text-gray-400 text-sm font-medium">No archived projects.</p>
        </div>
      </div>
    </div>
  );
}
