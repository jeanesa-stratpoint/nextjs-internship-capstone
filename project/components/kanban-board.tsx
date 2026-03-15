"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Circle,
  Clock,
  CheckCircle2,
  CheckCircle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useBoardStore, List, Task } from "@/stores/board-store";
import { useProjectBoard, useTaskMutations } from "@/hooks/use-tasks";
import TaskCard from "@/components/task-card";
import CreateTaskModal from "./modals/create-task-modal";
import ConfirmActionModal from "./modals/confirm-action-modal";

export type TeamMember = {
  id: string;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  imageUrl?: string;
};

const getColumnStyling = (name: string) => {
  if (name === "In Progress") return { icon: Clock, color: "text-amber-500" };
  if (name === "Review") return { icon: CheckCircle2, color: "text-emerald-500" };
  if (name === "Done") return { icon: CheckCircle, color: "text-rose-500" };
  return { icon: Circle, color: "text-gray-400" };
};

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useProjectBoard(projectId);
  const { updateListOrder, updateTaskOrder } = useTaskMutations(projectId);

  const { lists, tasks, setLists, setTasks, setBoardData } = useBoardStore();
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // OVERLAY STATE
  const [activeColumn, setActiveColumn] = useState<List | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (data?.lists && data?.tasks) {
      setBoardData(data.lists, data.tasks);
    }
  }, [data, setBoardData]);

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium">Loading Board...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-xl">Failed to load board data.</div>;
  }

  // DRAG START
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "Column") {
      setActiveColumn(active.data.current.column);
    }
    if (active.data.current?.type === "Task") {
      setActiveTask(active.data.current.task);
    }
  };

  // DRAG OVER
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      const activeIndex = tasks.findIndex((t) => t.id === active.id);
      const overIndex = tasks.findIndex((t) => t.id === over.id);

      if (tasks[activeIndex].listId !== tasks[overIndex].listId) {
        // Moved to a new column
        const newTasks = [...tasks];
        newTasks[activeIndex].listId = tasks[overIndex].listId;
        setTasks(arrayMove(newTasks, activeIndex, overIndex));
      } else {
        // Reordering in the same column
        setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    }

    if (isActiveTask && isOverColumn) {
      const activeIndex = tasks.findIndex((t) => t.id === active.id);
      const newTasks = [...tasks];
      newTasks[activeIndex].listId = over.id as string;
      setTasks(arrayMove(newTasks, activeIndex, activeIndex));
    }
  };

  // DRAG END
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    // Finished dragging a COLUMN
    if (active.data.current?.type === "Column") {
      if (active.id !== over.id) {
        const activeIndex = lists.findIndex((l) => l.id === active.id);
        const overIndex = lists.findIndex((l) => l.id === over.id);

        const newLists = arrayMove(lists, activeIndex, overIndex);
        setLists(newLists);

        // Map array to database format: { id, order }
        const listUpdates = newLists.map((list, index) => ({ id: list.id, order: index }));

        try {
          await updateListOrder.mutateAsync(listUpdates);
        } catch (err) {
          console.error("Failed to save column order:", err);
        }
      }
      return;
    }

    // 2. Finished dragging a TASK
    if (active.data.current?.type === "Task") {
      const updatedTasks = tasks.map((task) => {
        const tasksInList = tasks.filter((t) => t.listId === task.listId);
        const order = tasksInList.findIndex((t) => t.id === task.id);
        return { ...task, order };
      });

      setTasks(updatedTasks);
      const taskUpdates = updatedTasks.map((t) => ({ id: t.id, order: t.order, listId: t.listId }));

      try {
        await updateTaskOrder.mutateAsync(taskUpdates);
      } catch (err) {
        console.error("Failed to save task order:", err);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start">
        {/* HORIZONTAL SORTABLE CONTEXT (For Columns) */}
        <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
          {lists.map((column: List) => {
            const columnTasks = tasks.filter((task) => task.listId === column.id);
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                columnTasks={columnTasks}
                setActiveListId={setActiveListId}
                projectId={projectId}
                projectName={data.project.name}
                projectTeam={data.team}
                isFirst={lists[0]?.id === column.id}
                isLast={lists[lists.length - 1]?.id === column.id}
              />
            );
          })}
        </SortableContext>
      </div>

      {/* DRAG OVERLAY */}
      {typeof window !== "undefined" &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <KanbanColumn
                column={activeColumn}
                columnTasks={tasks.filter((t) => t.listId === activeColumn.id)}
                setActiveListId={() => {}}
                projectId={projectId}
                projectName={data.project.name}
                projectTeam={data.team}
                isOverlay
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                projectId={projectId}
                projectName={data.project.name}
                columnName={lists.find((l) => l.id === activeTask.listId)?.name || ""}
                projectTeam={data.team}
              />
            )}
          </DragOverlay>,
          document.body
        )}

      <CreateTaskModal
        isOpen={activeListId !== null}
        onClose={() => setActiveListId(null)}
        listId={activeListId || ""}
        projectId={projectId}
        projectName={data.project.name}
        projectTeam={data.team}
      />
    </DndContext>
  );
}

function KanbanColumn({
  column,
  columnTasks,
  setActiveListId,
  projectId,
  projectName,
  projectTeam,
  isOverlay = false,
  isFirst = false,
  isLast = false,
}: {
  column: List;
  columnTasks: Task[];
  setActiveListId: (id: string) => void;
  projectId: string;
  projectName: string;
  projectTeam: TeamMember[];
  isOverlay?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const { lists, setLists } = useBoardStore();
  const { deleteList, clearListTasks, updateListOrder } = useTaskMutations(projectId);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [showClearTasksModal, setShowClearTasksModal] = useState(false);

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const colStyle = getColumnStyling(column.name);
  const Icon = colStyle.icon;

  const handleMoveColumn = async (direction: "left" | "right") => {
    setIsMenuOpen(false);
    const currentIndex = lists.findIndex((l) => l.id === column.id);
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= lists.length) return;

    const newLists = arrayMove(lists, currentIndex, newIndex);
    setLists(newLists);

    const listUpdates = newLists.map((list, index) => ({ id: list.id, order: index }));
    try {
      await updateListOrder.mutateAsync(listUpdates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async () => {
    await deleteList.mutateAsync(column.id);
    setShowDeleteListModal(false);
  };

  const handleClearTasks = async () => {
    await clearListTasks.mutateAsync(column.id);
    setShowClearTasksModal(false);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex-shrink-0 w-[320px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-[20px] h-[500px] opacity-50"
      />
    );
  }

  return (
    <>
      <ConfirmActionModal
        isOpen={showDeleteListModal}
        onClose={() => setShowDeleteListModal(false)}
        onConfirm={handleDeleteList}
        title="Delete Column"
        description={`Are you sure you want to delete "${column.name}"? ALL tasks inside this column will also be permanently deleted.`}
        confirmText="Delete Column"
        isLoading={deleteList.isPending}
      />

      <ConfirmActionModal
        isOpen={showClearTasksModal}
        onClose={() => setShowClearTasksModal(false)}
        onConfirm={handleClearTasks}
        title="Clear All Tasks"
        description={`Are you sure you want to permanently delete all ${columnTasks.length} tasks in "${column.name}"?`}
        confirmText="Clear Tasks"
        isLoading={clearListTasks.isPending}
      />

      <div
        ref={setNodeRef}
        style={style}
        className={`flex-shrink-0 w-[320px] bg-[#F0F0F0] border border-[#BDBDBD] rounded-[20px] shadow-sm flex flex-col h-full max-h-[800px] ${isOverlay ? "rotate-2 scale-105 shadow-2xl cursor-grabbing" : ""}`}
      >
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-between p-5 border-b border-gray-50/50 cursor-grab active:cursor-grabbing group relative touch-none"
        >
          <div className="flex items-center gap-2">
            <Icon size={18} className={colStyle.color} />
            <h3 className="font-bold text-black">{column.name}</h3>
            <span className="text-xs font-bold text-gray-400 ml-1">{columnTasks.length}</span>
          </div>

          <div
            className="relative"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-gray-400 hover:text-black hover:bg-white rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <button
                  onClick={() => handleMoveColumn("left")}
                  disabled={isFirst}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move left
                  {isFirst && (
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      This is the left-most column
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleMoveColumn("right")}
                  disabled={isLast}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move right
                  {isLast && (
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      This is the right-most column
                    </span>
                  )}
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowClearTasksModal(true);
                  }}
                  disabled={columnTasks.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium disabled:opacity-50"
                >
                  Delete all tasks
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowDeleteListModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                >
                  Delete this list
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <SortableContext
            items={columnTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {columnTasks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center text-sm text-gray-400 font-medium bg-gray-50/50">
                Drop tasks here
              </div>
            ) : (
              columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  projectName={projectName}
                  columnName={column.name}
                  projectTeam={projectTeam}
                />
              ))
            )}
          </SortableContext>
        </div>

        <div className="p-3 mt-auto border-t border-gray-50/50">
          <button
            onClick={() => setActiveListId(column.id)}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-black hover:bg-white rounded-xl transition-colors"
          >
            <Plus size={16} /> Add task
          </button>
        </div>
      </div>
    </>
  );
}
