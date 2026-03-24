import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction,
  resolveProjectInviteAction,
  markNotificationAsUnreadAction
} from "@/actions/notifications";

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await markNotificationAsReadAction(notificationId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateNotifications
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsAsReadAction();
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateNotifications
  });

  const resolveInvite = useMutation({
    mutationFn: async ({ 
      notificationId, 
      invitationId, 
      status 
    }: { 
      notificationId: string; 
      invitationId: string; 
      status: "accepted" | "declined" 
    }) => {
      const result = await resolveProjectInviteAction(notificationId, invitationId, status);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: () => {
      invalidateNotifications();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const markAsUnread = useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await markNotificationAsUnreadAction(notificationId);
      if (!result.success) throw new Error(result.error as string);
      return result;
    },
    onSuccess: invalidateNotifications
  });

  return { markAsRead, markAllAsRead, resolveInvite, markAsUnread };
}