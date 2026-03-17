import Link from "next/link";
import KanbanBoard from "@/components/kanban-board";
import TaskDetailModal from "@/components/modals/task-detail-modal";
import ProjectCompletionModal from "@/components/modals/project-completion-modal";
import ProjectHeaderActions from "@/components/project-header-actions";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { queries } from "@/lib/db/queries";
import { auth } from "@clerk/nextjs/server";
import { hasSystemPermission } from "@/lib/rbac";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const project = await queries.projects.getById(projectId);
  const team = await queries.projects.getMembers(projectId);

  const canDeleteProject = await hasSystemPermission(userId, "project:delete");

  if (!project) notFound();

  const [
    canEditProject,
    canCreateList,
    canEditList,
    canDeleteList,
    canCreateTask,
    canEditTask,
    canDeleteTask,
  ] = await Promise.all([
    hasSystemPermission(userId, "project:edit"),
    hasSystemPermission(userId, "list:create"),
    hasSystemPermission(userId, "list:edit"),
    hasSystemPermission(userId, "list:delete"),
    hasSystemPermission(userId, "task:create"),
    hasSystemPermission(userId, "task:edit"),
    hasSystemPermission(userId, "task:delete"),
  ]);

  const boardPermissions = {
    canCreateList,
    canEditList,
    canDeleteList,
    canCreateTask,
    canEditTask,
    canDeleteTask,
  };

  return (
    <div className="h-full flex flex-col text-black overflow-hidden">
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-black" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.dueDate && (
              <span className="text-sm font-medium text-red-500 mt-1">
                Due: {new Date(project.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <ProjectHeaderActions
          project={project}
          team={team}
          canEditProject={canEditProject}
          canDeleteProject={canDeleteProject}
        />
      </div>

      <p className="text-gray-600 ml-14 max-w-4xl mb-8 flex-shrink-0">
        {project.description || "No description provided for this project."}
      </p>

      <div className="flex-1 overflow-hidden ml-14">
        <KanbanBoard project={project} permissions={boardPermissions} />
      </div>

      <TaskDetailModal canEditTask={canEditTask} canDeleteTask={canDeleteTask} />
      <ProjectCompletionModal projectId={project.id} />
    </div>
  );
}
