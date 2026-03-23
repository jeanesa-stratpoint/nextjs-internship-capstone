import KanbanBoardSkeleton from "@/components/kanban-board-skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="h-full flex flex-col text-black overflow-hidden">
      <KanbanBoardSkeleton />
    </div>
  );
}
