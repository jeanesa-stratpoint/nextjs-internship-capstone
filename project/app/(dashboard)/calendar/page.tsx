import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries";
import { hasSystemPermission } from "@/lib/rbac";
import { formatHeaderDate } from "@/lib/utils";

import CreateEventButton from "@/components/create-event-button";
import CreateEventModal from "@/components/modals/create-event-modal";
import CalendarWidget from "@/components/calendar-widget";
import TaskDetailModal from "@/components/modals/task-detail-modal";
import EventDetailModal from "@/components/modals/event-detail-modal";

export default async function CalendarPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // RBAC Permissions
  const canCreateEvent = await hasSystemPermission(userId, "event:create");
  const canEditEvent = await hasSystemPermission(userId, "event:edit");
  const canDeleteEvent = await hasSystemPermission(userId, "event:delete");

  // Fetch Data
  const userProjectsData = await queries.projects.getAllForUser(userId);
  const userProjects = userProjectsData.map((p) => p.project);
  const projectIds = userProjects.map((p) => p.id);

  const [tasks, events] = await Promise.all([
    queries.tasks.getByProjectIds(projectIds),
    queries.events.getByProjectIds(projectIds),
  ]);

  const currentDate = formatHeaderDate();

  return (
    <div className="space-y-4 text-black animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <CreateEventModal userProjects={userProjects} />
      <TaskDetailModal />
      <EventDetailModal
        canEdit={canEditEvent}
        canDelete={canDeleteEvent}
        userProjects={userProjects}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-2">{currentDate}</p>
          <h1 className="text-3xl font-bold text-black">Calendar</h1>
          <p className="text-gray-500 mt-2 text-sm">
            View project deadlines, task due dates, and team events.
          </p>
        </div>

        {canCreateEvent && <CreateEventButton />}
      </div>

      <CalendarWidget projects={userProjects} tasks={tasks} events={events} />
    </div>
  );
}
