import Link from "next/link";
import KanbanBoard from "@/components/kanban-board";
import TaskDetailModal from "@/components/modals/task-detail-modal";
import ProjectCompletionModal from "@/components/modals/project-completion-modal";
import ProjectHeaderActions from "@/components/project-header-actions";
import GlobalInviteModal from "@/components/modals/global-invite-modal";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { queries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import { hasSystemPermission } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const project = await queries.projects.getById(projectId);
  if (!project) notFound();

  const team = await queries.projects.getMembers(projectId);
  const localRole = await queries.projects.getMemberRole(projectId, userId);

  if (!localRole) redirect("/projects");

  const isOwner = project.ownerId === userId;
  const isProjectAdmin = localRole === "admin";

  const userProjectsData = await queries.projects.getAllForUser(userId);
  const userProjects = userProjectsData.map((p) => p.project);

  const canDeleteProject = await hasSystemPermission(userId, "project:delete");

  const hasEditAccess = isOwner || isProjectAdmin;
  const hasDeleteAccess = canDeleteProject && isOwner;

  const boardPermissions = {
    canCreateList: true,
    canEditList: true,
    canDeleteList: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
  };

  return (
    <div className="h-full flex flex-col text-black dark:text-zinc-100 overflow-hidden">
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-black dark:text-zinc-100" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.dueDate && (
              <span className="text-sm text-gray-500 dark:text-zinc-400 font-semibold mt-1">
                Due on {formatDate(new Date(project.dueDate))}
              </span>
            )}
          </div>
        </div>

        <ProjectHeaderActions
          project={project}
          team={team}
          canEditProject={hasEditAccess}
          canDeleteProject={hasDeleteAccess}
        />
      </div>

      <p className="text-gray-600 dark:text-zinc-400 ml-14 max-w-4xl mb-8 flex-shrink-0">
        {project.description || "No description provided for this project."}
      </p>

      <div className="flex-1 overflow-hidden ml-14 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <KanbanBoard project={project} permissions={boardPermissions} />
      </div>

      <TaskDetailModal canEditTask={true} canDeleteTask={true} />
      <ProjectCompletionModal projectId={project.id} />
      <GlobalInviteModal userProjects={userProjects} />
    </div>
  );
}
