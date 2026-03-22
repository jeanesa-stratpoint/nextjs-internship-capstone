"use client";

import { useEffect, useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  AlignLeft,
  Trash2,
  Edit2,
  Loader2,
  FolderKanban,
  Save,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useEventMutations } from "@/hooks/use-events";
import { format } from "date-fns";
import { DbProject } from "@/types";
import ConfirmActionModal from "./confirm-action-modal";

interface EventDetailModalProps {
  canEdit: boolean;
  canDelete: boolean;
  userProjects: DbProject[];
}

export default function EventDetailModal({
  canEdit,
  canDelete,
  userProjects,
}: EventDetailModalProps) {
  const { isEventDetailModalOpen, closeEventDetailModal, selectedEvent } = useUIStore();
  const { deleteEvent, updateEventDetails } = useEventMutations(selectedEvent?.projectId);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"meeting" | "milestone" | "reminder">("meeting");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing && selectedEvent) {
      setSelectedProjectId(selectedEvent.projectId);
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || "");
      setType(selectedEvent.type);
      setStartTime(format(new Date(selectedEvent.startTime), "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(new Date(selectedEvent.endTime), "yyyy-MM-dd'T'HH:mm"));
      setError("");
    }
  }, [isEditing, selectedEvent]);

  useEffect(() => {
    if (isEventDetailModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isEventDetailModalOpen]);

  const handleClose = () => {
    setIsEditing(false);
    closeEventDetailModal();
  };

  if (!isEventDetailModalOpen || !selectedEvent) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent.mutateAsync({ eventId: selectedEvent.id, projId: selectedEvent.projectId });
      setShowDeleteConfirm(false);
      handleClose();
    } catch (error) {
      console.error("Failed to delete event", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await updateEventDetails.mutateAsync({
        eventId: selectedEvent.id,
        data: {
          projectId: selectedProjectId,
          title,
          description: description || null,
          type,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        },
      });

      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to update event");
    }
  };

  const startDate = new Date(selectedEvent.startTime);
  const endDate = new Date(selectedEvent.endTime);

  return (
    <>
      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        description={`Are you sure you want to cancel "${selectedEvent.title}"?`}
        confirmText="Delete Event"
        isLoading={isDeleting}
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div
          className={`bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col ${isEditing ? "max-h-[90vh]" : ""}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-violet-50 flex-shrink-0">
            <div className="flex items-center gap-2 text-violet-700">
              {isEditing ? (
                <>
                  <Edit2 size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Editing Event</span>
                </>
              ) : (
                <>
                  <CalendarIcon size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {selectedEvent.type}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!isEditing && (
                <>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-gray-500 hover:text-black hover:bg-white rounded-full transition-colors"
                      title="Edit Event"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                </>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 text-gray-500 hover:text-black hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && isEditing && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex-shrink-0">
              {error}
            </div>
          )}

          {/* Content Body - Swaps between View and Edit modes */}
          {isEditing ? (
            <form
              id="edit-event-form"
              onSubmit={handleUpdate}
              className="p-6 overflow-y-auto flex-1 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Project
                </label>
                <div className="relative">
                  <FolderKanban
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none cursor-pointer text-black"
                  >
                    {userProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Event Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "meeting" | "milestone" | "reminder")}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm appearance-none text-black cursor-pointer"
                >
                  <option value="meeting">Meeting</option>
                  <option value="milestone">Milestone</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    min={startTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm resize-none text-black"
                />
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">{selectedEvent.title}</h2>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <Clock size={16} className="text-violet-500" />
                  <div>
                    <p>{format(startDate, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-black">
                      {format(startDate, "h:mm a")} — {format(endDate, "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlignLeft size={14} /> Description
                </h3>
                <div className="text-sm text-gray-700 bg-white border border-gray-200 p-4 rounded-xl min-h-[100px] whitespace-pre-wrap">
                  {selectedEvent.description || (
                    <span className="text-gray-400 italic">No description provided.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-gray-50/50">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-event-form"
                  disabled={updateEventDetails.isPending}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {updateEventDetails.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
