"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Circle, Loader2, MoreHorizontal } from "lucide-react";
import { useBoardStore, StoreList, StoreTask } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { useProjectBoard, useTaskMutations } from "@/hooks/use-tasks";
import { useListMutations } from "@/hooks/use-lists";
import { DbProject, TeamMember } from "@/types/index";
import TaskCard from "@/components/cards/task-card";
import CreateTaskModal from "./modals/create-task-modal";
import ConfirmActionModal from "./modals/confirm-action-modal";

const getColumnStyling = (column: StoreList) => {
  let color = column.color || "#6B7280";

  if (column.name === "In Progress" && color === "#6B7280") color = "#FFA724";
  if (column.name === "Review" && color === "#6B7280") color = "#007B50";
  if (column.name === "Done" && color === "#6B7280") color = "#FF8B81";

  return { icon: Circle, color };
};

const PRESET_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

export interface BoardPermissions {
  canCreateList: boolean;
  canEditList: boolean;
  canDeleteList: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
}

export default function KanbanBoard({
  project,
  permissions,
}: {
  project: DbProject;
  permissions: BoardPermissions;
}) {
  const projectId = project.id;
  const { data, isLoading, error } = useProjectBoard(projectId);
  const { updateTaskOrder } = useTaskMutations(projectId);
  const { createList, updateListOrder } = useListMutations(projectId);

  const { lists, tasks, setLists, setTasks, setBoardData } = useBoardStore();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [activeColumn, setActiveColumn] = useState<StoreList | null>(null);
  const [activeTask, setActiveTask] = useState<StoreTask | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#3B82F6");

  const { openProjectCompletionModal } = useUIStore();
  const hasPrompted = useRef(false);

  const searchParams = useSearchParams();
  const { openTaskDetailModal } = useUIStore();

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (data?.lists && data?.tasks) {
      setBoardData(data.lists, data.tasks);
    }
    return () => setBoardData([], []);
  }, [data, setBoardData]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const targetOrder = lists.length > 1 ? lists.length - 1 : lists.length;

      await createList.mutateAsync({
        name: newListName,
        order: targetOrder,
        color: newListColor,
      });
      setNewListName("");
      setIsAddingList(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isLoading || !data) return;
    if (lists.length > 0 && lists[0].projectId !== project.id) return;

    if (activeTask !== null || activeColumn !== null) return;

    if (project.status === "completed") return;
    if (tasks.length === 0) return;

    const endListId = lists.length > 0 ? lists[lists.length - 1].id : null;
    const allTasksCompleted =
      tasks.length > 0 && endListId && tasks.every((t) => t.listId === endListId);

    if (allTasksCompleted && !hasPrompted.current) {
      openProjectCompletionModal();
      hasPrompted.current = true;
    } else if (!allTasksCompleted && hasPrompted.current) {
      hasPrompted.current = false;
    }
  }, [
    lists,
    tasks,
    project,
    activeTask,
    activeColumn,
    openProjectCompletionModal,
    isLoading,
    data,
  ]);
  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  useEffect(() => {
    const taskIdFromUrl = searchParams.get("task");
    if (taskIdFromUrl) {
      openTaskDetailModal(taskIdFromUrl);
    }
  }, [searchParams, openTaskDetailModal]);

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400 dark:text-zinc-500" />
      </div>
    );
  if (error || !data)
    return (
      <div className="p-4 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl">
        Failed to load board data.
      </div>
    );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "Column") setActiveColumn(active.data.current.column);
    if (active.data.current?.type === "Task") setActiveTask(active.data.current.task);
    setOpenMenuId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      const activeIndex = tasks.findIndex((t) => t.id === active.id);
      const overIndex = tasks.findIndex((t) => t.id === over.id);
      if (tasks[activeIndex].listId !== tasks[overIndex].listId) {
        const newTasks = [...tasks];
        newTasks[activeIndex].listId = tasks[overIndex].listId;
        setTasks(arrayMove(newTasks, activeIndex, overIndex));
      } else {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "Column") {
      if (active.id !== over.id) {
        const activeIndex = lists.findIndex((l) => l.id === active.id);
        let overIndex = lists.findIndex((l) => l.id === over.id);

        if (lists[overIndex].stage === "unstarted") {
          overIndex = 1;
        } else if (lists[overIndex].stage === "completed") {
          overIndex = lists.length - 2;
        }

        if (activeIndex !== overIndex) {
          const newLists = arrayMove(lists, activeIndex, overIndex);
          setLists(newLists);
          const listUpdates = newLists.map((list, index) => ({ id: list.id, order: index }));
          try {
            await updateListOrder.mutateAsync(listUpdates);
          } catch (err) {
            console.error(err);
          }
        }
      }
      return;
    }

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
        console.error(err);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveColumn(null);
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start">
        <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
          {lists.map((column: StoreList) => {
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
                isMenuOpen={openMenuId === column.id}
                setMenuOpen={(isOpen) => setOpenMenuId(isOpen ? column.id : null)}
                permissions={permissions}
              />
            );
          })}
        </SortableContext>

        {permissions.canCreateList && (
          <div
            className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
              isAddingList ? "w-[85vw] max-w-[320px] sm:w-[320px]" : "w-[60px]"
            }`}
          >
            {!isAddingList ? (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-[60px] h-[60px] rounded-[20px] bg-[#F0F0F0]/50 dark:bg-zinc-900/50 border-2 border-dashed border-[#BDBDBD] dark:border-zinc-700 flex items-center justify-start px-[18px] text-gray-500 dark:text-zinc-400 hover:bg-[#F0F0F0] dark:hover:bg-zinc-800 hover:text-black dark:hover:text-zinc-200 transition-all duration-300 hover:w-[200px] group overflow-hidden"
              >
                <Plus size={20} className="flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium whitespace-nowrap ml-3">
                  Add another list
                </span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateList}
                className="bg-[#F0F0F0] dark:bg-zinc-900 p-4 rounded-[20px] shadow-sm border border-[#BDBDBD] dark:border-zinc-700 flex flex-col gap-3 w-[320px]"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="List name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 text-black dark:text-zinc-100 bg-white dark:bg-zinc-950"
                />
                <div className="flex justify-between items-center px-1 mt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewListColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${newListColor === color ? "scale-125 ring-2 ring-offset-2 ring-black dark:ring-zinc-400" : "hover:scale-110"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={createList.isPending || !newListName.trim()}
                    className="flex-1 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-300 disabled:opacity-50"
                  >
                    {createList.isPending ? (
                      <Loader2 size={14} className="animate-spin mx-auto" />
                    ) : (
                      "Save List"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-4 bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

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
                setMenuOpen={() => {}}
                isMenuOpen={false}
                permissions={permissions}
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                projectId={projectId}
                projectName={data.project.name}
                column={lists.find((l) => l.id === activeTask.listId)!}
                projectTeam={data.team}
                permissions={permissions}
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
  isMenuOpen,
  setMenuOpen,
  permissions,
}: {
  column: StoreList;
  columnTasks: StoreTask[];
  setActiveListId: (id: string) => void;
  projectId: string;
  projectName: string;
  projectTeam: TeamMember[];
  isOverlay?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isMenuOpen: boolean;
  setMenuOpen: (isOpen: boolean) => void;
  permissions: BoardPermissions;
}) {
  const isSystemColumn = column.stage === "unstarted" || column.stage === "completed";
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
    disabled: isSystemColumn || !permissions.canEditList,
  });

  const { lists, setLists } = useBoardStore();
  const { deleteList, clearListTasks, updateListOrder, updateListDetails } =
    useListMutations(projectId);

  const currentIndex = lists.findIndex((l) => l.id === column.id);
  const canMoveLeft = currentIndex > 0 && lists[currentIndex - 1]?.stage !== "unstarted";
  const canMoveRight =
    currentIndex < lists.length - 1 && lists[currentIndex + 1]?.stage !== "completed";

  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [showClearTasksModal, setShowClearTasksModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [editColor, setEditColor] = useState(column.color || "#9CA3AF");

  const PRESET_COLORS = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
  ];

  const style = { transition, transform: CSS.Translate.toString(transform) };
  const colStyle = getColumnStyling(column);
  const Icon = colStyle.icon;

  const handleMoveColumn = async (direction: "left" | "right") => {
    setMenuOpen(false);

    if (direction === "left" && !canMoveLeft) return;
    if (direction === "right" && !canMoveRight) return;

    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    const newLists = arrayMove(lists, currentIndex, newIndex);
    setLists(newLists);

    const listUpdates = newLists.map((list, index) => ({ id: list.id, order: index }));
    try {
      await updateListOrder.mutateAsync(listUpdates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await updateListDetails.mutateAsync({ listId: column.id, name: editName, color: editColor });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (isDragging)
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex-shrink-0 w-[85vw] max-w-[320px] sm:w-[320px] bg-gray-100 dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-[20px] h-[500px] opacity-50"
      />
    );

  return (
    <>
      <ConfirmActionModal
        isOpen={showDeleteListModal}
        onClose={() => setShowDeleteListModal(false)}
        onConfirm={async () => {
          await deleteList.mutateAsync(column.id);
          setShowDeleteListModal(false);
        }}
        title="Delete List"
        description={`Are you sure you want to delete "${column.name}"?`}
        confirmText="Delete List"
        isLoading={deleteList.isPending}
      />
      <ConfirmActionModal
        isOpen={showClearTasksModal}
        onClose={() => setShowClearTasksModal(false)}
        onConfirm={async () => {
          await clearListTasks.mutateAsync(column.id);
          setShowClearTasksModal(false);
        }}
        title="Clear All Tasks"
        description={`Delete all ${columnTasks.length} tasks in "${column.name}"?`}
        confirmText="Clear Tasks"
        isLoading={clearListTasks.isPending}
      />

      <div
        ref={setNodeRef}
        style={style}
        className={`flex-shrink-0 w-[85vw] max-w-[320px] sm:w-[320px] bg-[#F0F0F0] dark:bg-zinc-950 border border-[#BDBDBD] dark:border-zinc-800 rounded-[20px] shadow-sm flex flex-col h-full max-h-[800px] ${
          isOverlay ? "rotate-2 scale-105 shadow-2xl cursor-grabbing" : ""
        }`}
      >
        {isEditing ? (
          <form
            onSubmit={handleSaveEdit}
            className="p-4 border-b border-gray-50/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 rounded-t-[20px]"
          >
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm font-bold border border-gray-300 dark:border-zinc-700 rounded-lg mb-3 text-black dark:text-zinc-100 bg-white dark:bg-zinc-950"
            />
            <div className="flex justify-between items-center px-1 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    editColor === c
                      ? "scale-125 ring-2 ring-offset-2 ring-black dark:ring-zinc-400"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateListDetails.isPending}
                className="flex-1 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold py-1.5 rounded-2xl hover:bg-gray-800 dark:hover:bg-zinc-300 disabled:opacity-50"
              >
                {updateListDetails.isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-between p-5 border-b border-gray-50/50 dark:border-zinc-800/50 cursor-grab active:cursor-grabbing group relative touch-none"
          >
            <div className="flex items-center gap-2">
              <Icon size={18} style={{ color: colStyle.color }} />
              <h3 className="font-bold text-black dark:text-zinc-100">{column.name}</h3>
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 ml-1">
                {columnTasks.length}
              </span>
            </div>

            {(permissions.canEditList || permissions.canDeleteList) && (
              <div
                className="relative"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                <button
                  onClick={() => setMenuOpen(!isMenuOpen)}
                  className={`p-1.5 rounded-md transition-colors focus:opacity-100 ${
                    isMenuOpen
                      ? "opacity-100 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 shadow-sm"
                      : "opacity-0 text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 group-hover:opacity-100"
                  }`}
                >
                  <MoreHorizontal size={18} />
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 py-2 z-50">
                    {permissions.canEditList && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 font-medium"
                        >
                          Edit details
                        </button>
                        {!isSystemColumn && (
                          <>
                            <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1"></div>
                            <button
                              onClick={() => handleMoveColumn("left")}
                              disabled={!canMoveLeft}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 disabled:opacity-50"
                            >
                              Move left
                            </button>
                            <button
                              onClick={() => handleMoveColumn("right")}
                              disabled={!canMoveRight}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 disabled:opacity-50"
                            >
                              Move right
                            </button>
                          </>
                        )}
                        <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1"></div>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowClearTasksModal(true);
                          }}
                          disabled={columnTasks.length === 0}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium disabled:opacity-50"
                        >
                          Delete all tasks
                        </button>
                      </>
                    )}
                    {permissions.canDeleteList && !isSystemColumn && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setShowDeleteListModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium"
                      >
                        Delete this list
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <SortableContext
            items={columnTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {columnTasks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl h-24 flex items-center justify-center text-sm text-gray-400 dark:text-zinc-500 font-medium bg-gray-50/50 dark:bg-zinc-900/50">
                Drop tasks here
              </div>
            ) : (
              columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  projectName={projectName}
                  column={column}
                  projectTeam={projectTeam}
                  permissions={permissions}
                />
              ))
            )}
          </SortableContext>
        </div>

        {permissions.canCreateTask && (
          <div className="p-3 mt-auto border-t border-gray-50/50 dark:border-zinc-800/50">
            <button
              onClick={() => setActiveListId(column.id)}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Plus size={16} /> Add task
            </button>
          </div>
        )}
      </div>
    </>
  );
}
