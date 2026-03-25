import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatHeaderDate } from "@/lib/utils";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries";
import QuickActions from "@/components/quick-actions";
import ProjectCard from "@/components/cards/project-card";
import SearchFilterBar from "@/components/search-filter-bar";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q.toLowerCase() : "";
  const statusFilter = typeof resolvedParams.status === "string" ? resolvedParams.status : "all";
  const roleFilter = typeof resolvedParams.role === "string" ? resolvedParams.role : "all";

  const [canCreateProject, canDeleteProject, canInviteMember] = await Promise.all([
    hasSystemPermission(userId, "project:create"),
    hasSystemPermission(userId, "project:delete"),
    hasSystemPermission(userId, "project-invite:create"),
  ]);

  const projectsWithMetrics = await queries.projects.getProjectsWithMetrics(userId);

  const filteredProjects = projectsWithMetrics.filter((p) => {
    const matchesSearch =
      p.project.name.toLowerCase().includes(q) ||
      (p.project.description?.toLowerCase() || "").includes(q);

    const matchesStatus = statusFilter === "all" || p.project.status === statusFilter;

    let matchesRole = true;
    if (roleFilter === "owner") matchesRole = p.metrics.isOwner === true;
    if (roleFilter === "shared") matchesRole = p.metrics.isOwner === false;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const currentDate = formatHeaderDate();
  const activeProjects = filteredProjects.filter((p) => p.project.status === "active");
  const onHoldProjects = filteredProjects.filter((p) => p.project.status === "on-hold");
  const completedProjects = filteredProjects.filter((p) => p.project.status === "completed");

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

        <SearchFilterBar
          placeholder="Search projects..."
          filters={[
            {
              id: "status",
              label: "Project Status",
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "On Hold", value: "on-hold" },
                { label: "Completed", value: "completed" },
              ],
            },
            {
              id: "role",
              label: "My Role",
              options: [
                { label: "All Roles", value: "all" },
                { label: "Owned by Me", value: "owner" },
                { label: "Shared with Me", value: "shared" },
              ],
            },
          ]}
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <p className="text-gray-600 text-sm">Manage and organize your team projects</p>
        <QuickActions
          canCreateProject={canCreateProject}
          canInviteMember={canInviteMember}
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
      {(onHoldProjects.length > 0 || statusFilter === "on-hold") && (
        <div className="pt-2 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> On Hold (
            {onHoldProjects.length})
          </h2>
          {renderProjectGrid(onHoldProjects, "No projects on hold.")}
        </div>
      )}

      {/* COMPLETED PROJECTS */}
      {(completedProjects.length > 0 || statusFilter === "completed") && (
        <div className="pt-2 pb-12 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-lime-400"></div> Completed (
            {completedProjects.length})
          </h2>
          {renderProjectGrid(completedProjects, "No completed projects yet.")}
        </div>
      )}
    </div>
  );
}
