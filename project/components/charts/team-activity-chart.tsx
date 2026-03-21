"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface ActivityData {
  name: string;
  actions: number;
  comments: number;
}

export default function TeamActivityChart({ data }: { data: ActivityData[] }) {
  const hasActivity = data.some((d) => d.actions > 0 || d.comments > 0);

  if (!hasActivity) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        No team activity recorded in the last 7 days.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontWeight: "semibold", fill: "#6B7280" }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6B7280" }}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "#F3F4F6" }}
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            padding: "12px",
          }}
          labelStyle={{
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "4px",
          }}
          itemStyle={{
            fontWeight: "normal",
            color: "#4B5563",
          }}
        />
        <Legend
          verticalAlign="top"
          height={20}
          iconType="circle"
          wrapperStyle={{ fontSize: "12px", fontWeight: "600" }}
        />

        <Bar
          dataKey="actions"
          name="Task Actions"
          fill="#F59E0B"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="comments"
          name="Comments"
          fill="#60A5FA"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
