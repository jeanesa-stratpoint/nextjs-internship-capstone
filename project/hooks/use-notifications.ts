import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction,
  resolveProjectInviteAction,
  markNotificationAsUnreadAction,
  getUnreadNotificationCountAction
} from "@/actions/notifications";

const FALLBACK_POLLING_INTERVAL_MS = 30000;

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
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

export function useUnreadNotifications(userId: string | undefined, isPusherConnected: boolean) {
  return useQuery({
    queryKey: ["unread-notifications-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const res = await getUnreadNotificationCountAction();
      return res.success ? res.count : 0;
    },
    enabled: !!userId,
    refetchInterval: isPusherConnected ? false : FALLBACK_POLLING_INTERVAL_MS, 
  });
}