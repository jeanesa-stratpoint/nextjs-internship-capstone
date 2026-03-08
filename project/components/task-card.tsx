// TODO: Task 5.6 - Create task detail modals and editing interfaces

/*
TODO: Implementation Notes for Interns:

This component should display:
- Task title and description
- Priority indicator
- Assignee avatar
- Due date
- Labels/tags
- Comments count
- Drag handle for reordering

Props interface:
interface TaskCardProps {
  task: {
    id: string
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
    assignee?: User
    dueDate?: Date
    labels: string[]
    commentsCount: number
  }
  isDragging?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

Features to implement:
- Drag and drop support
- Click to open task modal
- Priority color coding
- Overdue indicators
- Responsive design
*/

// export function TaskCard() {
//   return (
//     <div className="bg-white dark:bg-outer_space-300 p-4 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400">
//       <p className="text-center text-payne's_gray-500 dark:text-french_gray-400 text-sm">
//         TODO: Implement TaskCard component
//       </p>
//     </div>
//   );
// }

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/stores/board-store";
import { CheckCircle2, Clock, Circle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

// EXPLICITLY DEFINING PROPS HERE
interface TaskCardProps {
  task: Task;
  projectName: string;
  columnName: string;
}

const getColumnStyle = (name: string) => {
  if (name === "In Progress") return { icon: Clock, iconColor: "text-amber-500", avatarBg: "bg-[#FFA724]", avatarText: "text-[#FFDAA2]" };
  if (name === "Review") return { icon: CheckCircle2, iconColor: "text-emerald-500", avatarBg: "bg-[#007B50]", avatarText: "text-[#B3D8B8]" };
  if (name === "Done") return { icon: CheckCircle, iconColor: "text-rose-500", avatarBg: "bg-[#FF8B81]", avatarText: "text-[#FFFFFF]" };
  return { icon: Circle, iconColor: "text-gray-400", avatarBg: "bg-[#7E7E7E]", avatarText: "text-[#BDBDBD]" };
};

const getPriorityStyle = (priority?: string | null) => {
  if (priority === "high") return "bg-[#FFD3D3] text-[#7B0002] border-[#7B0002]";
  if (priority === "low") return "bg-[#D3FFD8] text-[#007B50] border-[#007B50]";
  return "bg-[#D2E9FF] text-[#15538D] border-[#15538D]";
};

// DESTRUCTURING PROPS PERFECTLY HERE
export default function TaskCard({ task, projectName, columnName }: TaskCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ 
    id: task.id,
    data: { type: "Task", task } 
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const colStyle = getColumnStyle(columnName);
  const StatusIcon = colStyle.icon;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-4 bg-gray-50 border-2 border-blue_munsell-500 border-dashed rounded-xl h-[100px] opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 bg-[white] border border-gray-200 shadow-sm hover:shadow-md rounded-[16px] cursor-grab active:cursor-grabbing flex flex-col gap-2 relative group touch-none"
    >
      <div className="flex justify-between items-start mb-1">
        
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
          <StatusIcon size={12} className={colStyle.iconColor} />
          <span className="truncate max-w-[150px]">{projectName}</span>
        </div>

        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${colStyle.avatarBg} ${colStyle.avatarText}`}>
          UN
        </div>
      </div>

      <h4 className="text-sm font-bold text-black">{task.title}</h4>

      <div className="flex items-center justify-between mt-3">
        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-[3px] capitalize border ${getPriorityStyle(task.priority)}`}>
          {task.priority || "Medium"}
        </span>
        
        <span className="text-[10px] font-medium text-gray-400">
          Created {formatDate(task.createdAt)}
        </span>
      </div>
    </div>
  );
}