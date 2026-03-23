"use client";

import { Plus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export default function CreateEventButton() {
  const { openCreateEventModal } = useUIStore();

  return (
    <button
      onClick={openCreateEventModal}
      className="inline-flex items-center px-5 py-2.5 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
    >
      <Plus size={18} className="mr-1.5" />
      Add Event
    </button>
  );
}
