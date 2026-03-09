// import { Plus, Search, Filter } from "lucide-react";
// import { DashboardLayout } from "@/components/dashboard-layout";

// export default function ProjectsPage() {
//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
//               Projects
//             </h1>
//             <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
//               Manage and organize your team projects
//             </p>
//           </div>
//           <button className="inline-flex items-center px-4 py-2 bg-blue_munsell-500 text-white rounded-lg hover:bg-blue_munsell-600 transition-colors">
//             <Plus size={20} className="mr-2" />
//             New Project
//           </button>
//         </div>

//         {/* Implementation Tasks Banner */}
//         <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
//           <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
//             📋 Projects Page Implementation Tasks
//           </h3>
//           <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
//             <li>• Task 4.1: Implement project CRUD operations</li>
//             <li>• Task 4.2: Create project listing and dashboard interface</li>
//             <li>• Task 4.5: Design and implement project cards and layouts</li>
//             <li>• Task 4.6: Add project and task search/filtering capabilities</li>
//           </ul>
//         </div>

//         {/* Search and Filter Bar */}
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1">
//             <Search
//               className="absolute left-3 top-1/2 transform -translate-y-1/2 text-payne's_gray-500 dark:text-french_gray-400"
//               size={16}
//             />
//             <input
//               type="text"
//               placeholder="Search projects..."
//               className="w-full pl-10 pr-4 py-2 bg-white dark:bg-outer_space-500 border border-french_gray-300 dark:border-payne's_gray-400 rounded-lg text-outer_space-500 dark:text-platinum-500 placeholder-payne's_gray-500 dark:placeholder-french_gray-400 focus:outline-none focus:ring-2 focus:ring-blue_munsell-500"
//             />
//           </div>
//           <button className="inline-flex items-center px-4 py-2 border border-french_gray-300 dark:border-payne's_gray-400 text-outer_space-500 dark:text-platinum-500 rounded-lg hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 transition-colors">
//             <Filter size={16} className="mr-2" />
//             Filter
//           </button>
//         </div>

//         {/* Projects Grid Placeholder */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {[1, 2, 3, 4, 5, 6].map((i) => (
//             <div
//               key={i}
//               className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div className="w-3 h-3 bg-blue_munsell-500 rounded-full"></div>
//                 <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
//                   {Math.floor(Math.random() * 30) + 1} days left
//                 </div>
//               </div>

//               <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
//                 Sample Project {i}
//               </h3>

//               <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400 mb-4">
//                 This is a placeholder project description that will be replaced with actual project
//                 data.
//               </p>

//               <div className="flex items-center justify-between text-sm text-payne's_gray-500 dark:text-french_gray-400 mb-4">
//                 <span>{Math.floor(Math.random() * 8) + 2} members</span>
//                 <span>{Math.floor(Math.random() * 20) + 5} tasks</span>
//               </div>

//               <div className="w-full bg-french_gray-300 dark:bg-payne's_gray-400 rounded-full h-2">
//                 <div
//                   className="bg-blue_munsell-500 h-2 rounded-full"
//                   style={{ width: `${Math.floor(Math.random() * 80) + 20}%` }}
//                 ></div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Component Placeholders */}
//         <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
//           <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
//             📁 Components to Implement
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
//             <div>
//               <strong>components/project-card.tsx</strong>
//               <p>Project display component with progress, members, and actions</p>
//             </div>
//             <div>
//               <strong>components/modals/create-project-modal.tsx</strong>
//               <p>Modal for creating new projects with form validation</p>
//             </div>
//             <div>
//               <strong>hooks/use-projects.ts</strong>
//               <p>Custom hook for project data fetching and mutations</p>
//             </div>
//             <div>
//               <strong>lib/db/schema.ts</strong>
//               <p>Database schema for projects, lists, and tasks</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }
import { Search, Filter, Plus } from "lucide-react";
import CreateProjectModal from "@/components/modals/create-project-modal";
import ProjectCard from "@/components/project-card";
import { db } from "@/lib/db";
import { projects, projectMembers, lists, tasks } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { formatHeaderDate } from "@/lib/utils";
import { hasSystemPermission } from "@/lib/rbac";

export default async function ProjectsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const canCreateProject = await hasSystemPermission(userId, "project:create");
  const canInviteMember = await hasSystemPermission(userId, "project-invite:create");

  const userProjects = await db.select({ project: projects, role: projectMembers.role }).from(projectMembers).innerJoin(projects, eq(projectMembers.projectId, projects.id)).where(eq(projectMembers.userId, userId)).orderBy(desc(projects.createdAt));
  let ownerNameMap = new Map();
  if (userProjects.length > 0) {
    const ownerIds = [...new Set(userProjects.map((p) => p.project.ownerId))];
    const client = await clerkClient();
    const ownerData = await client.users.getUserList({ userId: ownerIds });
    ownerNameMap = new Map(ownerData.data.map((u) => [u.id, u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.emailAddresses[0].emailAddress]));
  }
  const projectIds = userProjects.map((p) => p.project.id);
  const allMembers = projectIds.length > 0 ? await db.select().from(projectMembers).where(inArray(projectMembers.projectId, projectIds)) : [];
  const allLists = projectIds.length > 0 ? await db.select().from(lists).where(inArray(lists.projectId, projectIds)) : [];
  const listIds = allLists.map((l) => l.id);
  const allTasks = listIds.length > 0 ? await db.select().from(tasks).where(inArray(tasks.listId, listIds)) : [];
  const currentDate = formatHeaderDate();

  return (
    <div className="space-y-8 text-black h-full flex flex-col">
      {/* TOP ROW */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search (e.g. Projects, Tasks...)"
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400 text-black"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-100/60 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-200 transition-colors">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <p className="text-gray-600 text-sm">Manage and organize your team projects</p>

        <div className="flex flex-col items-start lg:items-end gap-2">
          <span className="text-xs font-bold text-black mb-1">Quick Actions</span>
          <div className="flex flex-wrap items-center gap-3">
            {canCreateProject && <CreateProjectModal />}
              {canInviteMember && (
                <button className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
                  <Plus size={16} className="text-gray-500" /> Add Team Member
                </button>
              )
            }
            <button className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
              <Plus size={16} className="text-gray-500" /> Create Task
            </button>
            
          </div>
        </div>
      </div>

      {/* ACTIVE PROJECTS GRID */}
      <div className="pt-2">
        <h2 className="text-lg font-bold mb-4">Active Projects ({userProjects.length})</h2>

        {userProjects.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-12 text-center flex flex-col items-center justify-center">
            <p className="text-gray-500 font-medium mb-4">
              No projects yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {userProjects.map(({ project }, index) => {
              // CALCULATE METRICS FOR THIS CARD
              const memberCount = allMembers.filter((m) => m.projectId === project.id).length;

              const projectListIds = allLists
                .filter((l) => l.projectId === project.id)
                .map((l) => l.id);
              const projectTasks = allTasks.filter((t) => projectListIds.includes(t.listId));

              const doneListIds = allLists
                .filter((l) => l.projectId === project.id && l.name.toLowerCase() === "done")
                .map((l) => l.id);
              const completedTasks = projectTasks.filter((t) =>
                doneListIds.includes(t.listId)
              ).length;

              const isOwner = project.ownerId === userId;
              const ownerName = ownerNameMap.get(project.ownerId) || "Unknown User";

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  isActive={true}
                  memberCount={memberCount}
                  taskCount={projectTasks.length}
                  completedTaskCount={completedTasks}
                  ownerName={ownerName}
                  isOwner={isOwner}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ARCHIVE GRID */}
      <div className="pt-6 pb-12">
        <h2 className="text-lg font-bold mb-4">Archive</h2>
        <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-8 text-center bg-gray-50/50">
          <p className="text-gray-400 text-sm font-medium">No archived projects.</p>
        </div>
      </div>
    </div>
  );
}
