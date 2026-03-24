"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { getPusherClient } from "@/lib/pusher";
import { useUnreadNotifications } from "@/hooks/use-notifications";

export default function NotificationBadge({ isCollapsed }: { isCollapsed: boolean }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isPusherConnected, setIsPusherConnected] = useState(false);

  const { data: unreadCount = 0 } = useUnreadNotifications(user?.id, isPusherConnected);

  useEffect(() => {
    if (!user?.id) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    pusher.connection.bind("state_change", (states: { current: string }) => {
      setIsPusherConnected(states.current === "connected");
    });

    const channelName = `user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-notification", () => {
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      pusher.connection.unbind("state_change");
      channel.unbind("new-notification");
      pusher.unsubscribe(channelName);
    };
  }, [user?.id, queryClient]);

  if (unreadCount === 0) return null;

  // Tiny dot for collapsed sidebar
  if (isCollapsed) {
    return (
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#E7E2DC] rounded-full animate-in zoom-in duration-300" />
    );
  }

  // Numbered pill for expanded sidebar
  return (
    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-in zoom-in duration-300">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
