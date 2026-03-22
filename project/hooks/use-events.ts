import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventAction, updateEventDetailsAction, deleteEventAction } from "@/actions/events";

export function useEventMutations(projectId?: string) {
  const queryClient = useQueryClient();

  const invalidateCalendar = () => {
    queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ["projectBoard", projectId] });
    }
  };

  const createEvent = useMutation({
    mutationFn: async (data: {
      projectId: string;
      title: string;
      description?: string | null;
      type: "meeting" | "milestone" | "reminder";
      startTime: Date;
      endTime: Date;
    }) => {
      const result = await createEventAction(data);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateCalendar,
  });

  const updateEventDetails = useMutation({
    mutationFn: async ({ eventId, data }: { 
      eventId: string; 
      data: {
        projectId: string;
        title: string;
        description?: string | null;
        type: "meeting" | "milestone" | "reminder";
        startTime: Date;
        endTime: Date;
      } 
    }) => {
      const result = await updateEventDetailsAction(eventId, data);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateCalendar,
  });

  const deleteEvent = useMutation({
    mutationFn: async ({ eventId, projId }: { eventId: string, projId: string }) => {
      const result = await deleteEventAction(eventId, projId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateCalendar,
  });

  return {
    createEvent,
    updateEventDetails,
    deleteEvent,
  };
}