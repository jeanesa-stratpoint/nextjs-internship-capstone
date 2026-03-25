import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries";
import { formatHeaderDate, getGreeting } from "@/lib/utils";
import { Users, FolderKanban, LucideIcon } from "lucide-react";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const stats = await queries.admin.getSystemStats(userId);
  const currentUser = await queries.users.getById(userId);
  const greeting = getGreeting();

  return (
    <div className="space-y-10 text-black dark:text-zinc-100 flex flex-col pb-10 animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 dark:text-zinc-400 font-semibold uppercase">
          {formatHeaderDate()} — System Administration
        </p>
        <h1 className="text-4xl font-bold text-black dark:text-zinc-100">
          {greeting}, {currentUser?.firstName || "Admin"}
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">
          Manage workspace permissions, global roles, and system-wide configurations.
        </p>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminStatCard
          title="Total System Users"
          value={stats.totalUsers}
          description="Registered accounts across all teams"
          icon={Users}
          color="blue"
        />
        <AdminStatCard
          title="Active Projects"
          value={stats.activeProjects}
          description="Current running workspaces"
          icon={FolderKanban}
          color="orange"
        />
      </div>

      {/* QUICK LINKS / PLACEHOLDER FOR NEXT STEPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-8 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center min-h-[200px]">
          <h3 className="text-lg font-bold mb-2">User Management</h3>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
            Update employee job titles, grant Project Manager permissions, or manage system access
            levels.
          </p>
          <a
            href="/admin/users"
            className="w-fit px-6 py-2.5 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-full hover:bg-gray-800 dark:hover:bg-zinc-300 transition-colors"
          >
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: "blue" | "orange" | "green";
}) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 w-1.5",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 w-1.5",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 w-1.5",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden flex flex-col h-44 transition-all duration-300 hover:shadow-md">
      <div className={`absolute left-0 top-0 bottom-0 ${colorMap[color]}`}></div>

      <div className="pl-3 flex items-center gap-3 text-gray-500 dark:text-zinc-400 mb-2">
        <Icon size={20} />
        <span className="text-sm font-bold uppercase">{title}</span>
      </div>

      <div className="pl-3 mt-2 flex flex-col">
        <span className="text-5xl font-bold text-black dark:text-zinc-100">{value}</span>
        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mt-1">{description}</p>
      </div>
    </div>
  );
}
