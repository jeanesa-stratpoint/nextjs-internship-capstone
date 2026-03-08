import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats a database timestamp into "Mar 8, 2026"
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Generates the YYYY-MM-DD format required by HTML <input type="date">
// It automatically calculates your local timezone so "today" is perfectly accurate!
export function getTodayString(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
  return localISOTime;
}