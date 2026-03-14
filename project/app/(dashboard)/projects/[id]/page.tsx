import Link from "next/link";
import KanbanBoard from "@/components/kanban-board";
import TaskDetailModal from "@/components/modals/task-detail-modal";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, CalendarDays } from "lucide-react";
import { queries } from "@/lib/db/queries";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const project = await queries.projects.getById(projectId);

  if (!project) notFound();

  return (
    <div className="h-full flex flex-col text-black overflow-hidden">
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-black" />
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>

        <div className="flex items-center gap-4 text-gray-500">
          <button className="hover:text-black transition-colors">
            <Users size={24} />
          </button>
          <button className="hover:text-black transition-colors">
            <CalendarDays size={24} />
          </button>
        </div>
      </div>

      <p className="text-gray-600 ml-14 max-w-4xl mb-8 flex-shrink-0">
        {project.description || "No description provided for this project."}
      </p>

      <div className="flex-1 overflow-hidden ml-14">
        <KanbanBoard projectId={project.id} />
      </div>

      <TaskDetailModal />
    </div>
  );
}
