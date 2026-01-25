"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            borderColor: "#27272a",
            color: "#fff",
            borderRadius: "8px",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
          itemStyle={{ color: "#fff" }}
          cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="start"
          stroke="#6366f1"
          strokeWidth={2}
          activeDot={{ r: 6, fill: "#6366f1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
