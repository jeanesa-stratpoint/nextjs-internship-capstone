// import { ArrowLeft, Settings, Users, Calendar, MoreHorizontal } from "lucide-react";
// import Link from "next/link";
// import { DashboardLayout } from "@/components/dashboard-layout";

// export default function ProjectPage({ params }: { params: { id: string } }) {
//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         {/* Project Header */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Link
//               href="/projects"
//               className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors"
//             >
//               <ArrowLeft size={20} />
//             </Link>
//             <div>
//               <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
//                 Project #{params.id}
//               </h1>
//               <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-1">
//                 Kanban board view for project management
//               </p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
//               <Users size={20} />
//             </button>
//             <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
//               <Calendar size={20} />
//             </button>
//             <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
//               <Settings size={20} />
//             </button>
//             <button className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors">
//               <MoreHorizontal size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Implementation Tasks Banner */}
//         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
//           <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
//             🎯 Kanban Board Implementation Tasks
//           </h3>
//           <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
//             <li>• Task 5.1: Design responsive Kanban board layout</li>
//             <li>• Task 5.2: Implement drag-and-drop functionality with dnd-kit</li>
//             <li>• Task 5.4: Implement optimistic UI updates for smooth interactions</li>
//             <li>• Task 5.6: Create task detail modals and editing interfaces</li>
//           </ul>
//         </div>

//         {/* Kanban Board Placeholder */}
//         <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
//           <div className="flex space-x-6 overflow-x-auto pb-4">
//             {["To Do", "In Progress", "Review", "Done"].map((columnTitle, columnIndex) => (
//               <div key={columnTitle} className="flex-shrink-0 w-80">
//                 <div className="bg-platinum-800 dark:bg-outer_space-400 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400">
//                   <div className="p-4 border-b border-french_gray-300 dark:border-payne's_gray-400">
//                     <div className="flex items-center justify-between">
//                       <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500">
//                         {columnTitle}
//                         <span className="ml-2 px-2 py-1 text-xs bg-french_gray-300 dark:bg-payne's_gray-400 rounded-full">
//                           {Math.floor(Math.random() * 5) + 1}
//                         </span>
//                       </h3>
//                       <button className="p-1 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded">
//                         <MoreHorizontal size={16} />
//                       </button>
//                     </div>
//                   </div>

//                   <div className="p-4 space-y-3 min-h-[400px]">
//                     {[1, 2, 3].map((taskIndex) => (
//                       <div
//                         key={taskIndex}
//                         className="p-4 bg-white dark:bg-outer_space-300 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 cursor-pointer hover:shadow-md transition-shadow"
//                       >
//                         <h4 className="font-medium text-outer_space-500 dark:text-platinum-500 text-sm mb-2">
//                           Sample Task {taskIndex}
//                         </h4>
//                         <p className="text-xs text-payne's_gray-500 dark:text-french_gray-400 mb-3">
//                           This is a placeholder task description
//                         </p>
//                         <div className="flex items-center justify-between">
//                           <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue_munsell-100 text-blue_munsell-700 dark:bg-blue_munsell-900 dark:text-blue_munsell-300">
//                             Medium
//                           </span>
//                           <div className="w-6 h-6 bg-blue_munsell-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
//                             U
//                           </div>
//                         </div>
//                       </div>
//                     ))}

//                     <button className="w-full p-3 border-2 border-dashed border-french_gray-300 dark:border-payne's_gray-400 rounded-lg text-payne's_gray-500 dark:text-french_gray-400 hover:border-blue_munsell-500 hover:text-blue_munsell-500 transition-colors">
//                       + Add task
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Component Implementation Guide */}
//         <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
//           <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
//             🛠️ Components & Features to Implement
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
//             <div>
//               <strong className="block mb-2">Core Components:</strong>
//               <ul className="space-y-1 list-disc list-inside">
//                 <li>components/kanban-board.tsx</li>
//                 <li>components/task-card.tsx</li>
//                 <li>components/modals/create-task-modal.tsx</li>
//                 <li>stores/board-store.ts (Zustand)</li>
//               </ul>
//             </div>
//             <div>
//               <strong className="block mb-2">Advanced Features:</strong>
//               <ul className="space-y-1 list-disc list-inside">
//                 <li>Drag & drop with @dnd-kit/core</li>
//                 <li>Real-time updates</li>
//                 <li>Task assignments & due dates</li>
//                 <li>Comments & activity history</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

import { db } from "@/lib/db";
import { projects, lists, tasks, projectMembers } from "@/lib/db/schema"; // <-- Added lists import
import { eq, asc, inArray } from "drizzle-orm"; // <-- Added asc import
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CalendarDays } from "lucide-react";
import KanbanBoard from "@/components/kanban-board";
import { clerkClient } from "@clerk/nextjs/server";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  // 1. Fetch the project
  const projectResult = await db.select().from(projects).where(eq(projects.id, projectId));

  const project = projectResult[0];

  if (!project) {
    notFound();
  }

  // 1. FETCH THE REAL TEAM MEMBERS FROM CLERK
  const membersData = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  const memberIds = membersData.map((m) => m.userId);

  const client = await clerkClient();
  const clerkUsers = await client.users.getUserList({ userId: memberIds });

  // Clean up the data for the frontend
  const projectTeam = clerkUsers.data.map((u) => ({
    id: u.id,
    name: u.firstName
      ? `${u.firstName} ${u.lastName || ""}`.trim()
      : u.emailAddresses[0].emailAddress,
    imageUrl: u.imageUrl,
  }));

  // 2. Fetch the real columns (lists) for this project
  let boardLists = await db
    .select()
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(asc(lists.order));

  // 3. If the project has no columns, auto-generate the 4 defaults!
  if (boardLists.length === 0) {
    boardLists = await db
      .insert(lists)
      .values([
        { name: "To Do", projectId: projectId, order: 0 },
        { name: "In Progress", projectId: projectId, order: 1 },
        { name: "Review", projectId: projectId, order: 2 },
        { name: "Done", projectId: projectId, order: 3 },
      ])
      .returning();
  }

  // 3. NEW: Extract the IDs of the columns we just fetched
  const listIds = boardLists.map((list) => list.id);

  // 4. NEW: Fetch all tasks that belong to these columns
  const boardTasks = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.listId, listIds))
    .orderBy(asc(tasks.order));
  console.log(" SERVER FETCHED TASKS:", boardTasks);

  return (
    <div className="h-full flex flex-col text-black overflow-hidden">
      {/* HEADER ROW RESTORED! */}
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

      {/* DESCRIPTION RESTORED! */}
      <p className="text-gray-600 ml-14 max-w-4xl mb-8 flex-shrink-0">
        {project.description || "No description provided for this project."}
      </p>

      {/* 5. NEW: Pass initialTasks to the KanbanBoard! */}
      <div className="flex-1 overflow-hidden ml-14">
        <KanbanBoard
          projectId={project.id}
          projectName={project.name}
          initialLists={boardLists}
          initialTasks={boardTasks}
          projectTeam={projectTeam}
        />
      </div>
    </div>
  );
}
