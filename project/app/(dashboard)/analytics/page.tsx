import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries";
import { formatHeaderDate } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import AnalyticsCard from "@/components/cards/analytics-card";
import ProjectProgressChart from "@/components/charts/project-progress-chart";
import TeamActivityChart from "@/components/charts/team-activity-chart";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const data = await queries.analytics.getDashboardMetrics(userId);
  const currentDate = formatHeaderDate();

  return (
    <div className="space-y-8 text-black h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
      </div>

      <p className="text-gray-600 text-sm">
        Track project performance, team productivity, and task velocity across your collaborative
        workspaces.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <AnalyticsCard
          title="Project Velocity"
          value={data.velocity}
          unit="tasks / week"
          icon={TrendingUp}
          colorClass="sky"
        />
        <AnalyticsCard
          title="Team Efficiency"
          value={`${data.efficiency}%`}
          unit="completion rate"
          icon={BarChart3}
          colorClass="lime"
        />
        <AnalyticsCard
          title="Active Users"
          value={data.activeUsers}
          unit="this week"
          icon={Users}
          colorClass="indigo"
        />
        <AnalyticsCard
          title="Avg. Task Time"
          value={data.avgTaskTime}
          unit="days to complete"
          icon={Clock}
          colorClass="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12 mt-8 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-both">
        <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-black mb-1">Project Progress</h3>
          <p className="text-xs text-gray-500 mb-6 font-medium">
            Distribution of tasks across your projects
          </p>
          <div className="h-64 w-full">
            <ProjectProgressChart data={data.progressChart} />
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-black mb-1">Team Activity</h3>
          <p className="text-xs text-gray-500 mb-6 font-medium">
            Task movements and comments (last 7 days)
          </p>
          <div className="h-64 w-full">
            <TeamActivityChart data={data.activityChart} />
          </div>
        </div>
      </div>
    </div>
  );
}
