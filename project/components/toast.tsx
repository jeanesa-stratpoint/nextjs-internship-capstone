"use client";

import { useToastStore, DEFAULT_TOAST_DURATION } from "@/stores/toast-store";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastProps {
  toast: {
    message: string;
    description?: string;
    type?: "success" | "error" | "default";
    action?: { label: string; onClick: () => void };
    duration?: number;
  };
  hideToast: () => void;
}

export default function GlobalToast() {
  const { toast, hideToast } = useToastStore();

  if (!toast) return null;

  return <ToastContent key={toast.message} toast={toast} hideToast={hideToast} />;
}

function ToastContent({ toast, hideToast }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || DEFAULT_TOAST_DURATION;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration]);

  return (
    <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`relative overflow-hidden flex items-center justify-between gap-6 p-4 rounded-xl shadow-2xl min-w-[320px] border ${
          toast.type === "error"
            ? "bg-red-50 border-red-200 text-red-800"
            : toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-gray-900 border-gray-500 text-white"
        }`}
      >
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="flex flex-col relative z-10">
          <span className="text-sm font-bold">{toast.message}</span>
          {toast.description && (
            <span className={`text-xs mt-0.5 ${toast.type ? "opacity-80" : "text-gray-400"}`}>
              {toast.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                hideToast();
              }}
              className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={hideToast}
            className="p-1 hover:bg-white/20 rounded-full transition-colors opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
