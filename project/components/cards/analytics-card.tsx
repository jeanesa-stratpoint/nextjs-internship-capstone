import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  colorClass: "sky" | "lime" | "indigo" | "amber" | "rose" | "gray";
}

const colorStyles = {
  sky: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  lime: "bg-lime-50 text-lime-600 border-lime-100 dark:bg-lime-500/10 dark:text-lime-400 dark:border-lime-500/20",
  indigo:
    "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
  amber:
    "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  gray: "bg-gray-50 text-gray-600 border-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const hoverBorderStyles = {
  sky: "hover:border-sky-400",
  lime: "hover:border-lime-400",
  indigo: "hover:border-indigo-400",
  amber: "hover:border-amber-400",
  rose: "hover:border-rose-400",
  gray: "hover:border-gray-400",
};

export default function AnalyticsCard({
  title,
  value,
  unit,
  icon: Icon,
  colorClass,
}: AnalyticsCardProps) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default ${hoverBorderStyles[colorClass]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${colorStyles[colorClass]}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="text-3xl font-bold text-black dark:text-zinc-100 mb-1">{value}</div>
      <div className="text-md font-semibold text-gray-500 dark:text-zinc-400 mb-1">{title}</div>
      <div className="text-sm text-gray-400 dark:text-zinc-500 font-medium">{unit}</div>
    </div>
  );
}
