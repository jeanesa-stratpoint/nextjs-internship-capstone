import { create } from "zustand";

export const DEFAULT_TOAST_DURATION = 5000;

interface ToastOptions {
  message: string;
  description?: string;
  type?: "success" | "error" | "default";
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastState {
  toast: ToastOptions | null;
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (options) => {
    set({ toast: options });
    setTimeout(() => {
      set((state) => (state.toast?.message === options.message ? { toast: null } : state));
    }, options.duration || DEFAULT_TOAST_DURATION);
  },
  hideToast: () => set({ toast: null }),
}));