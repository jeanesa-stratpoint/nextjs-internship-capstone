// TODO: Task 5.1 - Design responsive Kanban board layout
// TODO: Task 5.2 - Implement drag-and-drop functionality with dnd-kit

/*
TODO: Implementation Notes for Interns:

This is the main Kanban board component that should:
- Display columns (lists) horizontally
- Allow drag and drop of tasks between columns
- Support adding new tasks and columns
- Handle real-time updates
- Be responsive on mobile

Key dependencies to install:
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities

Features to implement:
- Drag and drop tasks between columns
- Drag and drop to reorder tasks within columns
- Add new task button in each column
- Add new column functionality
- Optimistic updates (Task 5.4)
- Real-time persistence (Task 5.5)
- Mobile responsive design
- Loading states
- Error handling

State management:
- Use Zustand store for board state (Task 5.3)
- Implement optimistic updates
- Handle conflicts with server state
*/

"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Circle, Clock, CheckCircle2, CheckCircle } from "lucide-react";
import { useBoardStore, List, Task } from "@/stores/board-store";
import TaskCard from "@/components/task-card";
import CreateTaskModal from "./modals/create-task-modal";
import { updateTaskStatus } from "@/actions/tasks";

export type TeamMember = { id: string; name: string; imageUrl: string };

const getColumnStyling = (name: string) => {
  if (name === "In Progress") return { icon: Clock, color: "text-amber-500" };
  if (name === "Review") return { icon: CheckCircle2, color: "textemerald-500" };
  if (name === "Done") return { icon: CheckCircle, color: "text-rose-500" };
  return { icon: Circle, color: "text-gray-400" };
};

export default function KanbanBoard({
  projectId,
  projectName,
  initialLists,
  initialTasks,
  projectTeam, 
}: {
  projectId: string;
  projectName: string;
  initialLists: List[];
  initialTasks: Task[];
  projectTeam: TeamMember[]; 
}) {
  const { tasks, setBoardData, moveTask } = useBoardStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    setBoardData(initialLists, initialTasks);
  }, [setBoardData, initialLists, initialTasks, isMounted]);

  if (!isMounted) return null;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const activeTask = tasks.find((t) => t.id === taskId);

    if (!activeTask) return;

    const isOverList = initialLists.some((list) => list.id === overId);
    let targetListId = overId;

    if (!isOverList) {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetListId = overTask.listId;
      } else {
        return;
      }
    }

    if (activeTask.listId !== targetListId) {
      moveTask(taskId, targetListId, 0);
      await updateTaskStatus(taskId, targetListId, projectId);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div
        className="flex h-full gap-6 overflow-x-auto pb-4 items-start"
        data-project-id={projectId}
      >
        {initialLists.map((column) => {
          const columnTasks = tasks.filter((task) => task.listId === column.id);
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              columnTasks={columnTasks}
              setActiveListId={setActiveListId}
              projectName={projectName}
              projectTeam={projectTeam} 
            />
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={activeListId !== null}
        onClose={() => setActiveListId(null)}
        listId={activeListId || ""}
        projectId={projectId}
        projectName={projectName}
        projectTeam={projectTeam} 
      />
    </DndContext>
  );
}

function KanbanColumn({
  column,
  columnTasks,
  setActiveListId,
  projectName,
  projectTeam, 
}: {
  column: List;
  columnTasks: Task[];
  setActiveListId: (id: string) => void;
  projectName: string;
  projectTeam: TeamMember[]; 
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = getColumnStyling(column.name);
  const Icon = style.icon;

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-[320px] bg-[#F0F0F0] border border-[#BDBDBD] rounded-[20px] shadow-sm flex flex-col h-full max-h-[800px]"
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-50/50">
        <div className="flex items-center gap-2">
          <Icon size={18} className={style.color} />
          <h3 className="font-bold text-black">{column.name}</h3>
        </div>
        <span className="text-xs font-bold text-gray-400">{columnTasks.length}</span>
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
                projectName={projectName}
                columnName={column.name}
                projectTeam={projectTeam} 
              />
            ))
          )}
        </SortableContext>
      </div>

      <div className="p-3 mt-auto">
        <button
          onClick={() => setActiveListId(column.id)}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Add task
        </button>
      </div>
    </div>
  );
}
