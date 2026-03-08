// TODO: Task 4.5 - Design and implement project cards and layouts

/*
TODO: Implementation Notes for Interns:

This component should display:
- Project name and description
- Progress indicator
- Team member count
- Due date
- Status badge
- Actions menu (edit, delete, etc.)

Props interface:
interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    progress: number
    memberCount: number
    dueDate?: Date
    status: 'active' | 'completed' | 'on-hold'
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

Features to implement:
- Hover effects
- Click to navigate to project board
- Responsive design
- Loading states
- Error states
*/

// export function ProjectCard() {
//   return (
//     <div className="bg-white dark:bg-outer_space-500 p-6 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400">
//       <p className="text-center text-payne's_gray-500 dark:text-french_gray-400">
//         TODO: Implement ProjectCard component
//       </p>
//     </div>
//   );
// }

"use client";

import { projects } from "@/lib/db/schema";
import Link from "next/link";

// This tells TypeScript exactly what a "Project" looks like based on your DB schema
type Project = typeof projects.$inferSelect;

export default function ProjectCard({ 
  project, 
  index, 
  isActive 
}: { 
  project: Project; 
  index: number; 
  isActive: boolean;
}) {
  // Deterministic math for UI placeholder data (until we build the tasks/members tables!)
  const members = (index % 3) + 2;
  const tasks = (index * 4) + 10;
  const progress = ((index * 15) % 80) + 20;
  
  // Rotating colors matching your Figma mockups
  const colors = [
    "bg-red-100", "bg-indigo-100", "bg-blue-100", 
    "bg-amber-100", "bg-green-100", "bg-rose-100"
  ];
  const progressColors = [
    "bg-red-400", "bg-indigo-400", "bg-blue-400", 
    "bg-amber-400", "bg-green-400", "bg-rose-400"
  ];
  const colorIndex = index % colors.length;

  // Format the real database timestamp to a readable string
  const createdDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Link 
      href={`/projects/${project.id}`}
      className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group cursor-pointer block"
    >
      
      {/* Left side color accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors[colorIndex]}`}></div>

      <div className="pl-2 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-2">
          {/* REAL DATA: Project Name */}
          <h3 className="text-lg font-bold text-black line-clamp-1">{project.name}</h3>
          <span className="text-xs font-bold text-black shrink-0">{isActive ? '8 days left' : 'Archived'}</span>
        </div>

        {/* Metadata */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 font-medium mb-1">Created on {createdDate}</p>
          <p className="text-xs text-gray-400 font-medium">
            Owned by <span className="text-gray-400 font-bold">You</span>
          </p>
        </div>

        {/* Footer: Progress & Members */}
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">{members} members</span>
            <span className="text-xs font-bold text-black">{tasks} tasks</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${progressColors[colorIndex]}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
}