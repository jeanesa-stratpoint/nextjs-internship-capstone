"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
import TaskCard from "@/components/task-card";
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

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (data?.lists && data?.tasks) {
      setBoardData(data.lists, data.tasks);
    }
  }, [data, setBoardData]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      await createList.mutateAsync({
        name: newListName,
        order: data.lists.length,
        color: newListColor,
      });
      setNewListName("");
      setIsAddingList(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
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
  }, [lists, tasks, project.status, activeTask, activeColumn, openProjectCompletionModal]);

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  if (error || !data)
    return <div className="p-4 text-red-500 bg-red-50">Failed to load board data.</div>;

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
        const overIndex = lists.findIndex((l) => l.id === over.id);
        const newLists = arrayMove(lists, activeIndex, overIndex);
        setLists(newLists);
        const listUpdates = newLists.map((list, index) => ({ id: list.id, order: index }));
        try {
          await updateListOrder.mutateAsync(listUpdates);
        } catch (err) {
          console.error(err);
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
            className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isAddingList ? "w-[320px]" : "w-[60px]"}`}
          >
            {!isAddingList ? (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-[60px] h-[60px] rounded-[20px] bg-[#F0F0F0]/50 border-2 border-dashed border-[#BDBDBD] flex items-center justify-start px-[18px] text-gray-500 hover:bg-[#F0F0F0] hover:text-black transition-all duration-300 hover:w-[200px] group overflow-hidden"
              >
                <Plus size={20} className="flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium whitespace-nowrap ml-3">
                  Add another list
                </span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateList}
                className="bg-[#F0F0F0] p-4 rounded-[20px] shadow-sm border border-[#BDBDBD] flex flex-col gap-3 w-[320px]"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="List name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
                <div className="flex justify-between items-center px-1 mt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewListColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${newListColor === color ? "scale-125 ring-2 ring-offset-2 ring-black" : "hover:scale-110"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={createList.isPending || !newListName.trim()}
                    className="flex-1 bg-black text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-50"
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
                    className="px-4 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 font-bold text-xs"
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
  isFirst = false,
  isLast = false,
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
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
    disabled: !permissions.canEditList,
  });

  const { lists, setLists } = useBoardStore();
  const { deleteList, clearListTasks, updateListOrder, updateListDetails } =
    useListMutations(projectId);

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
        className="flex-shrink-0 w-[320px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-[20px] h-[500px] opacity-50"
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
        className={`flex-shrink-0 w-[320px] bg-[#F0F0F0] border border-[#BDBDBD] rounded-[20px] shadow-sm flex flex-col h-full max-h-[800px] ${
          isOverlay ? "rotate-2 scale-105 shadow-2xl cursor-grabbing" : ""
        }`}
      >
        {isEditing ? (
          <form
            onSubmit={handleSaveEdit}
            className="p-4 border-b border-gray-50/50 bg-white rounded-t-[20px]"
          >
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm font-bold border border-gray-300 rounded-lg mb-3 text-black"
            />
            <div className="flex justify-between items-center px-1 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    editColor === c ? "scale-125 ring-2 ring-offset-2 ring-black" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateListDetails.isPending}
                className="flex-1 bg-black text-white text-xs font-bold py-1.5 rounded-2xl hover:bg-gray-800"
              >
                {updateListDetails.isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 bg-gray-200 text-gray-600 text-xs font-bold rounded-2xl hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-between p-5 border-b border-gray-50/50 cursor-grab active:cursor-grabbing group relative touch-none"
          >
            <div className="flex items-center gap-2">
              <Icon size={18} style={{ color: colStyle.color }} />
              <h3 className="font-bold text-black">{column.name}</h3>
              <span className="text-xs font-bold text-gray-400 ml-1">{columnTasks.length}</span>
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
                      ? "opacity-100 bg-white text-black shadow-sm"
                      : "opacity-0 text-gray-400 hover:text-black hover:bg-white group-hover:opacity-100"
                  }`}
                >
                  <MoreHorizontal size={18} />
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {permissions.canEditList && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          Edit details
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                          onClick={() => handleMoveColumn("left")}
                          disabled={isFirst}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Move left
                        </button>
                        <button
                          onClick={() => handleMoveColumn("right")}
                          disabled={isLast}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Move right
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowClearTasksModal(true);
                          }}
                          disabled={columnTasks.length === 0}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium disabled:opacity-50"
                        >
                          Delete all tasks
                        </button>
                      </>
                    )}
                    {permissions.canDeleteList && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setShowDeleteListModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
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
                  column={column}
                  projectTeam={projectTeam}
                  permissions={permissions}
                />
              ))
            )}
          </SortableContext>
        </div>

        {permissions.canCreateTask && (
          <div className="p-3 mt-auto border-t border-gray-50/50">
            <button
              onClick={() => setActiveListId(column.id)}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-black hover:bg-white rounded-xl transition-colors"
            >
              <Plus size={16} /> Add task
            </button>
          </div>
        )}
      </div>
    </>
  );
}
