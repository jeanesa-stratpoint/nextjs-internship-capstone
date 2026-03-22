"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, Event as RbcEvent, ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useUIStore } from "@/stores/ui-store";
import { DbProject, DbTask, DbEvent } from "@/types";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type CalendarResource = DbTask | DbProject | DbEvent;

interface UnifiedCalendarEvent extends RbcEvent {
  id: string;
  type: "task" | "project" | "event";
  resource: CalendarResource;
}

interface CalendarWidgetProps {
  tasks: DbTask[];
  projects: DbProject[];
  events: DbEvent[];
}

const CustomToolbar = (toolbar: ToolbarProps<UnifiedCalendarEvent, object>) => {
  const goToBack = () => toolbar.onNavigate("PREV");
  const goToNext = () => toolbar.onNavigate("NEXT");
  const goToCurrent = () => toolbar.onNavigate("TODAY");

  const setView = (view: "month" | "week" | "day" | "agenda") => toolbar.onView(view);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={goToBack}
          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goToCurrent}
          className="px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Today
        </button>
        <button
          onClick={goToNext}
          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-black ml-2">{toolbar.label}</h2>
      </div>

      <div className="hidden sm:flex space-x-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setView("month")}
          className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${toolbar.view === "month" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
        >
          Month
        </button>
        <button
          onClick={() => setView("week")}
          className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${toolbar.view === "week" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
        >
          Week
        </button>
        <button
          onClick={() => setView("day")}
          className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${toolbar.view === "day" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
        >
          Day
        </button>
      </div>
    </div>
  );
};

export default function CalendarWidget({ tasks, projects, events }: CalendarWidgetProps) {
  const router = useRouter();
  const { openTaskDetailModal, openEventDetailModal } = useUIStore();

  const calendarEvents = useMemo(() => {
    const unifiedEvents: UnifiedCalendarEvent[] = [];

    tasks.forEach((task) => {
      if (task.dueDate) {
        unifiedEvents.push({
          id: `task-${task.id}`,
          title: `Task: ${task.title}`,
          start: new Date(task.dueDate),
          end: new Date(task.dueDate),
          allDay: true,
          type: "task",
          resource: task,
        });
      }
    });

    projects.forEach((project) => {
      if (project.dueDate) {
        unifiedEvents.push({
          id: `proj-${project.id}`,
          title: `Deadline: ${project.name}`,
          start: new Date(project.dueDate),
          end: new Date(project.dueDate),
          allDay: true,
          type: "project",
          resource: project,
        });
      }
    });

    events.forEach((event) => {
      unifiedEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        allDay: false,
        type: "event",
        resource: event,
      });
    });

    return unifiedEvents;
  }, [tasks, projects, events]);

  const eventStyleGetter = (event: UnifiedCalendarEvent) => {
    let backgroundColor = "#3174ad";
    if (event.type === "task") backgroundColor = "#0EA5E9";
    if (event.type === "project") backgroundColor = "#EF4444";
    if (event.type === "event") backgroundColor = "#8B5CF6";

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        border: "none",
        color: "white",
        fontSize: "11px",
        lineHeight: "1.2",
        fontWeight: "600",
        padding: "2px 8px",
        marginBottom: "2px",
      },
    };
  };

  const handleSelectEvent = (event: UnifiedCalendarEvent) => {
    if (event.type === "task") openTaskDetailModal((event.resource as DbTask).id);
    else if (event.type === "project") router.push(`/projects/${(event.resource as DbProject).id}`);
    else if (event.type === "event") openEventDetailModal(event.resource as DbEvent);
  };

  return (
    <div className="h-[750px] bg-white rounded-[20px] p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 mb-2 px-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div> Tasks
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <div className="w-3 h-3 rounded-full bg-red-500"></div> Project Deadlines
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <div className="w-3 h-3 rounded-full bg-violet-500"></div> Events
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100% - 40px)" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        views={["month", "week", "day"]}
        defaultView="month"
        popup
        components={{
          toolbar: CustomToolbar,
        }}
      />
    </div>
  );
}
