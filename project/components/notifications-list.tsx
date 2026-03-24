"use client";

import {
  Check,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  Bell,
  Loader2,
  XCircle,
  MailOpen,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatNotificationDate } from "@/lib/utils";
import { useNotificationMutations } from "@/hooks/use-notifications";
import { useToastStore } from "@/stores/toast-store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationItem } from "@/types/index";

export default function NotificationsList({ initialData }: { initialData: NotificationItem[] }) {
  const router = useRouter();
  const { markAsRead, markAllAsRead, markAsUnread, resolveInvite } = useNotificationMutations();
  const { showToast } = useToastStore();

  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>(initialData);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolvedInvites, setResolvedInvites] = useState<Record<string, "accepted" | "declined">>(
    {}
  );

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const unreadCount = localNotifications.filter((n) => !n.isRead).length;

  // PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(localNotifications.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = localNotifications.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setItemsPerPage(value);
      setCurrentPage(1);
    }
  };

  // HANDLERS
  const handleMarkAsRead = async (id: string, actionUrl: string | null) => {
    setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await markAsRead.mutateAsync(id);
    if (actionUrl) router.push(actionUrl);
  };

  const handleToggleReadStatus = async (
    e: React.MouseEvent,
    id: string,
    currentlyRead: boolean
  ) => {
    e.stopPropagation();
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !currentlyRead } : n))
    );
    if (currentlyRead) await markAsUnread.mutateAsync(id);
    else await markAsRead.mutateAsync(id);
  };

  const handleMarkAllAsRead = async () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllAsRead.mutateAsync();
  };

  const handleResolveInvite = async (
    e: React.MouseEvent,
    notificationId: string,
    invitationId: string | null,
    status: "accepted" | "declined"
  ) => {
    e.stopPropagation();
    if (!invitationId) return;
    setProcessingId(notificationId);

    try {
      await resolveInvite.mutateAsync({ notificationId, invitationId, status });
      setResolvedInvites((prev) => ({ ...prev, [notificationId]: status }));
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      showToast({
        message: status === "accepted" ? "Project joined successfully!" : "Invitation declined.",
        type: "success",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process invitation.";
      showToast({ message: errorMessage, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "project_invite":
        return <UserPlus size={18} className="text-blue-500" />;
      case "task_assigned":
        return <CheckCircle2 size={18} className="text-green-500" />;
      case "mention":
        return <MessageSquare size={18} className="text-amber-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  if (localNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-gray-200 rounded-[24px] bg-white animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
          <Bell size={32} />
        </div>
        <h3 className="text-lg font-bold text-black mb-2">All caught up!</h3>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          You have no notifications right now.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/30">
        <span className="text-sm font-bold text-gray-500">
          {unreadCount} Unread {unreadCount === 1 ? "Notification" : "Notifications"}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
          >
            {markAllAsRead.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="divide-y divide-gray-50">
        {paginatedNotifications.map((notification) => {
          const isProcessing = processingId === notification.id;

          const resolveStatus =
            resolvedInvites[notification.id] ||
            (notification.invitationStatus && notification.invitationStatus !== "pending"
              ? notification.invitationStatus
              : undefined);

          return (
            <div
              key={notification.id}
              className={`p-4 sm:p-5 flex gap-3 sm:gap-4 transition-colors cursor-pointer group ${
                notification.isRead
                  ? "bg-white hover:bg-gray-50"
                  : "bg-blue-50/40 hover:bg-blue-50/70"
              }`}
              onClick={() => handleMarkAsRead(notification.id, notification.actionUrl)}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.isRead ? "bg-gray-100" : "bg-white shadow-sm border border-blue-100"
                }`}
              >
                {getIconForType(notification.type)}
              </div>

              {/* Content Container */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                  <h4
                    className={`text-sm truncate ${notification.isRead ? "font-semibold text-gray-700" : "font-bold text-black"}`}
                  >
                    {notification.title}
                  </h4>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                      {formatNotificationDate(notification.createdAt)}
                    </span>

                    <button
                      onClick={(e) =>
                        handleToggleReadStatus(e, notification.id, notification.isRead)
                      }
                      className={`p-1.5 rounded-full transition-opacity ${
                        notification.isRead
                          ? "opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-gray-200 hover:text-black"
                          : "text-blue-500 hover:bg-blue-100"
                      }`}
                      title={notification.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      {notification.isRead ? <Mail size={16} /> : <MailOpen size={16} />}
                    </button>

                    {!notification.isRead && (
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>

                <p
                  className={`text-xs sm:text-sm line-clamp-2 sm:line-clamp-none ${notification.isRead ? "text-gray-500" : "text-gray-600"}`}
                >
                  {notification.message}
                </p>

                {/* Interactive Action Buttons */}
                {notification.type === "project_invite" && !resolveStatus && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button
                      onClick={(e) =>
                        handleResolveInvite(
                          e,
                          notification.id,
                          notification.referenceId,
                          "accepted"
                        )
                      }
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-black text-white text-[11px] sm:text-xs font-bold rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={(e) =>
                        handleResolveInvite(
                          e,
                          notification.id,
                          notification.referenceId,
                          "declined"
                        )
                      }
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-[11px] sm:text-xs font-bold rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Decline
                    </button>
                  </div>
                )}

                {/* Status Badge */}
                {resolveStatus && (
                  <div className="mt-2 sm:mt-3">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-xl uppercase ${
                        resolveStatus === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {resolveStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Pagination Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
        {/* Left Side: Items Per Page Input */}
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-xs text-gray-500 font-medium">
            Items per page:
          </label>
          <input
            id="itemsPerPage"
            type="number"
            min="1"
            max="100"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="w-16 px-2 py-1.5 text-xs text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-white shadow-sm"
          />
        </div>

        {/* Right Side: Page Controls (Only show if totalPages > 1) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-xs text-gray-500 font-medium text-center hidden sm:block">
              Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to{" "}
              <span className="font-bold text-gray-900">
                {Math.min(startIndex + itemsPerPage, localNotifications.length)}
              </span>{" "}
              of <span className="font-bold text-gray-900">{localNotifications.length}</span>{" "}
              entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
