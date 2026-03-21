"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export interface ProgressData {
  name: string;
  value: number;
}

const STAGE_COLORS: Record<string, string> = {
  "To Do": "#9CA3AF",
  "In Progress": "#0EA5E9",
  Completed: "#84CC16",
};

export default function ProjectProgressChart({ data }: { data: ProgressData[] }) {
  const activeData = data.filter((item) => item.value > 0);

  if (activeData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        No task data available to display.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={activeData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {activeData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STAGE_COLORS[entry.name] || "#111827"}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          itemStyle={{ fontWeight: "bold", color: "#111827" }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
