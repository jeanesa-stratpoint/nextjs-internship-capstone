"use client";

import { Trash2, Loader2 } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmText: string;
  isLoading?: boolean;
  variant?: "global" | "inner";
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isLoading,
  variant = "global",
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 border border-red-100">
        <Trash2 size={32} className="text-red-600" />
      </div>
      <h3 className="text-2xl font-bold text-black mb-2">{title}</h3>
      <p className="text-gray-500 mb-8 text-sm px-2">{description}</p>
      <div className="flex gap-3 w-full mt-auto sm:mt-0">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing...
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </>
  );

  if (variant === "inner") {
    return (
      <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200 rounded-[24px]">
        {modalContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-center flex flex-col items-center">
        {modalContent}
      </div>
    </div>
  );
}
