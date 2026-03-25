"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  Event as RbcEvent,
  ToolbarProps,
  View,
} from "react-big-calendar";
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100 rounded-2xl transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goToCurrent}
          className="px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-zinc-100 rounded-2xl transition-colors"
        >
          Today
        </button>
        <button
          onClick={goToNext}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100 rounded-2xl transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex-1 text-center">
        <h2 className="text-lg sm:text-xl font-bold text-black dark:text-zinc-100">
          {toolbar.label}
        </h2>
      </div>
      <div className="hidden sm:flex space-x-2 bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-2xl">
        <button
          onClick={() => setView("month")}
          className={`px-4 py-1.5 text-sm font-bold rounded-xl transition-colors ${toolbar.view === "month" ? "bg-white dark:bg-zinc-700 text-black dark:text-zinc-100 shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100"}`}
        >
          Month
        </button>
        <button
          onClick={() => setView("week")}
          className={`px-4 py-1.5 text-sm font-bold rounded-xl transition-colors ${toolbar.view === "week" ? "bg-white dark:bg-zinc-700 text-black dark:text-zinc-100 shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100"}`}
        >
          Week
        </button>
        <button
          onClick={() => setView("day")}
          className={`px-4 py-1.5 text-sm font-bold rounded-xl transition-colors ${toolbar.view === "day" ? "bg-white dark:bg-zinc-700 text-black dark:text-zinc-100 shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100"}`}
        >
          Day
        </button>
      </div>
    </div>
  );
};

const CustomDateHeader = ({ date }: { date: Date }) => {
  return (
    <div className="flex flex-col items-center justify-center py-1.5">
      <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase">
        {format(date, "EEE")}
      </span>
      <span className="text-lg sm:text-xl font-bold text-[#4b5563] dark:text-zinc-100 mt-0.25">
        {format(date, "d")}
      </span>
    </div>
  );
};

export default function CalendarWidget({ tasks, projects, events }: CalendarWidgetProps) {
  const router = useRouter();
  const { openTaskDetailModal, openEventDetailModal } = useUIStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const defaultScrollTime = new Date(1970, 1, 1, 8, 0, 0);

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
    let color = "white";
    if (event.type === "task") ((backgroundColor = "#bfdbfe"), (color = "#1e40af"));
    if (event.type === "project") ((backgroundColor = "#fecdd3"), (color = "#9f1239"));
    if (event.type === "event") ((backgroundColor = "#c7d2fe"), (color = "#4338ca"));

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        border: "none",
        color,
        fontSize: "11.5px",
        lineHeight: "1.2",
        fontWeight: "500",
        padding: "2px 8px",
        marginBottom: "1px",
      },
    };
  };

  const handleSelectEvent = (event: UnifiedCalendarEvent) => {
    if (event.type === "task") openTaskDetailModal((event.resource as DbTask).id);
    else if (event.type === "project") router.push(`/projects/${(event.resource as DbProject).id}`);
    else if (event.type === "event") openEventDetailModal(event.resource as DbEvent);
  };

  return (
    <div className="h-[720px] bg-white dark:bg-zinc-900 rounded-[20px] p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center gap-4 mb-2 px-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-zinc-400">
          <div className="w-3 h-3 rounded-full bg-blue-200"></div> Tasks
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-zinc-400">
          <div className="w-3 h-3 rounded-full bg-rose-200"></div> Project Deadlines
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-zinc-400">
          <div className="w-3 h-3 rounded-full bg-indigo-300"></div> Events
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100% - 25px)" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        date={currentDate}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        view={currentView}
        onView={(newView) => setCurrentView(newView)}
        views={["month", "week", "day"]}
        popup
        step={15}
        timeslots={2}
        scrollToTime={defaultScrollTime}
        components={{
          toolbar: CustomToolbar,
          week: { header: CustomDateHeader },
          day: { header: CustomDateHeader },
        }}
      />
    </div>
  );
}
