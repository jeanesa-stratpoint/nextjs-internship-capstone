"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  isDestructive = true,
}: ConfirmActionModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}
        >
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 font-semibold rounded-xl transition-colors disabled:opacity-50 text-white ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-800"}`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
