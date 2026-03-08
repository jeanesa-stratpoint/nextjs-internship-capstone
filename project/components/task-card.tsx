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
import { CheckCircle2 } from "lucide-react";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  // 1. The dnd-kit hook that makes this component draggable!
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: { type: "Task", task } 
  });

  // 2. This applies the visual CSS transform while you are dragging
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // 3. If we are currently dragging this card, leave a semi-transparent placeholder behind
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-4 bg-gray-50 border-2 border-blue_munsell-500 border-dashed rounded-xl h-[100px] opacity-50"
      />
    );
  }

  // 4. The actual rendered card
  return (
    <div
      ref={setNodeRef}
      style={style}
      // These attributes make the entire card a draggable handle
      {...attributes}
      {...listeners}
      className="p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-[16px] cursor-grab active:cursor-grabbing flex flex-col gap-2 relative group touch-none"
    >
      {/* Card Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <CheckCircle2 size={12} />
          <span>Project #</span>
        </div>
        {/* Dummy Assignee Avatar */}
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">
          AS
        </div>
      </div>

      {/* Real Task Title */}
      <h4 className="text-sm font-bold text-black">{task.title}</h4>

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-3">
        {/* WE FIXED THE BUG: Now using real data with basic dynamic styling! */}
        <span className={`px-2 py-1 text-[10px] font-bold rounded-md capitalize border 
          ${task.priority === 'low' ? 'bg-[#D3FFD8] text-[#007B50] border-[#007B50]' : 
            task.priority === 'high' ? 'bg-[#FFD3D3] text-[#7B0002] border-[#7B0002]' : 
            'bg-[#D2E9FF] text-[#15538D] border-[#15538D]'}`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}