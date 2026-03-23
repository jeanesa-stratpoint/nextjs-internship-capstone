import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getTodayString(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localISOTime = new Date(today.getTime() - offset).toISOString().slice(0, 10);
  return localISOTime;
}

export function formatHeaderDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatEventDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "EEEE, MMMM d, yyyy");
}

export function formatEventTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "h:mm a");
}

export function formatDateTimeInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}
