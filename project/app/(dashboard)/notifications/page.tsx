import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { queries } from "@/lib/db/queries";
import NotificationsList from "@/components/notifications-list";
import { NotificationItem } from "@/types/index";

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const rawNotifications = await queries.notifications.getUserNotifications(userId);

  const notifications: NotificationItem[] = rawNotifications as NotificationItem[];

  return (
    <div className="space-y-8 text-black pb-12 w-full">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Stay updated on project invites, task assignments, and team activity.
        </p>
      </div>

      <NotificationsList initialData={notifications} />
    </div>
  );
}
