"use client";

import { Trash2, AlertCircle, Loader2 } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmText: string;
  isLoading?: boolean;
  variant?: "global" | "inner";
  isDestructive?: boolean;
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
  isDestructive = true,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const isDestructiveAction = isDestructive !== false;

  const iconBgColor = isDestructiveAction
    ? "bg-red-50 dark:bg-red-500/10"
    : "bg-blue-50 dark:bg-blue-500/10";
  const iconBorderColor = isDestructiveAction
    ? "border-red-100 dark:border-red-500/20"
    : "border-blue-100 dark:border-blue-500/20";
  const iconColor = isDestructiveAction
    ? "text-red-600 dark:text-red-400"
    : "text-blue-600 dark:text-blue-400";
  const buttonBgColor = isDestructiveAction
    ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600";
  const IconComponent = isDestructiveAction ? Trash2 : AlertCircle;

  const modalContent = (
    <>
      <div
        className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center center mb-5 border ${iconBorderColor}`}
      >
        <IconComponent size={32} className={iconColor} />
      </div>
      <h3 className="text-2xl font-bold text-black dark:text-zinc-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm px-2">{description}</p>
      <div className="flex gap-3 w-full mt-auto sm:mt-0">
        <button
          onClick={onClose}
          className="flex-1 py-3 text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-3 text-sm font-semibold text-white ${buttonBgColor} rounded-xl transition-colors flex items-center justify-center gap-2`}
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
      <div className="absolute inset-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200 rounded-[24px]">
        <div className="max-w-md w-full flex flex-col items-center justify-center">
          {modalContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-center flex flex-col items-center">
        {modalContent}
      </div>
    </div>
  );
}
