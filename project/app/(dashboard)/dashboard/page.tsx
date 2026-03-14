import QuickActions from "@/components/quick-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { hasSystemPermission } from "@/lib/rbac";
import { queries } from "@/lib/db/queries";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const canCreateProject = await hasSystemPermission(userId, "project:create");
  const canInviteMember = await hasSystemPermission(userId, "project-invite:create");

  const userProjects = await queries.projects.getAllForUser(userId);

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-black">Dashboard Overview</h1>

        <QuickActions
          canCreateProject={canCreateProject}
          canInviteMember={canInviteMember}
          userProjects={userProjects.map((p) => ({ id: p.project.id, name: p.project.name }))}
        />
      </div>

      <div className="h-64 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
        <p className="text-gray-500 font-medium">Your Dashboard Content goes here</p>
      </div>
    </div>
  );
}
