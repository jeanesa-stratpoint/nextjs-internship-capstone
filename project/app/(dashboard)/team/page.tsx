import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries/index";
import { hasSystemPermission } from "@/lib/rbac";
import { formatHeaderDate } from "@/lib/utils";
import { Users } from "lucide-react";
import TeamCard, { TeamMemberData } from "@/components/cards/team-card";
import TeamInviteButton from "@/components/buttons/team-invite-button";
import GlobalInviteModal from "@/components/modals/global-invite-modal";
import PendingInvitationsList from "@/components/pending-invitations-list";

export default async function TeamPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teamMembers = await queries.users.getTeamMembers(userId);
  const sentInvitations = await queries.projects.getSentInvitations(userId);
  const canInviteMember = await hasSystemPermission(userId, "project-invite:create");
  const userProjectsData = await queries.projects.getAllForUser(userId);
  const userProjects = userProjectsData.map((p) => p.project);

  const currentDate = formatHeaderDate();

  return (
    <div className="space-y-8 text-black dark:text-zinc-100 h-full flex flex-col ">
      {/* TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold">Team</h1>
        </div>
        {canInviteMember && <TeamInviteButton />}
      </div>

      <p className="text-gray-600 dark:text-zinc-400 text-sm">
        View and manage the people you collaborate with across all your projects.
      </p>

      {/* TEAM GRID */}
      {teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[24px] bg-gray-50/50 dark:bg-zinc-800/50 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-zinc-500">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-black dark:text-zinc-100 mb-2">
            No team members yet
          </h3>
          <p className="text-gray-500 dark:text-zinc-500 text-sm text-center max-w-sm">
            You aren&apos;t collaborating with anyone right now. Create a project and invite some
            people to see them here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-12 animate-in slide-in-from-bottom-4 fade-in duration-700">
          {teamMembers.map((member: TeamMemberData) => (
            <TeamCard key={member.id} member={member} canManageTeam={canInviteMember} />
          ))}
        </div>
      )}
      <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
        <PendingInvitationsList invitations={sentInvitations} />
      </div>

      {canInviteMember && <GlobalInviteModal userProjects={userProjects} />}
    </div>
  );
}
