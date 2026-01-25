"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, GitCommit } from "lucide-react";

export function RoadmapTab({ data, isDark }) {
  const [activeStatus, setActiveStatus] = useState("planned");

  const roadmapItems = {
    planned: data.roadmap?.planned || [],
    "in-progress": data.roadmap?.in_progress || [],
    done: data.roadmap?.shipped || [],
  };

  const statusConfig = {
    planned: {
      label: "Planned",
      icon: Circle,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      borderColor: "border-amber-200 dark:border-amber-500/20",
      activeBorder: "border-amber-500 dark:border-amber-400",
    },
    "in-progress": {
      label: "In Progress",
      icon: Clock,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      borderColor: "border-blue-200 dark:border-blue-500/20",
      activeBorder: "border-blue-500 dark:border-blue-400",
    },
    done: {
      label: "Completed",
      icon: CheckCircle2,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      borderColor: "border-emerald-200 dark:border-emerald-500/20",
      activeBorder: "border-emerald-500 dark:border-emerald-400",
    },
  };

  // Get current items based on selection
  const currentItems = roadmapItems[activeStatus] || [];
  const currentConfig = statusConfig[activeStatus];

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-2 px-1">
        <h3 className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
          Product Roadmap
        </h3>
      </div>

      {/* Tab Switcher */}
      <div className="shrink-0 sticky top-0 z-20 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 pb-2 -mx-6 px-6 pt-2 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(roadmapItems).map(([status, items]) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isActive = activeStatus === status;

            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 relative",
                  isActive
                    ? `bg-white dark:bg-zinc-900 border-2 ${config.activeBorder} shadow-sm`
                    : "bg-zinc-100 dark:bg-zinc-900/50 border border-transparent hover:bg-white dark:hover:bg-zinc-800",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isActive
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 dark:text-zinc-500",
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-lg font-bold leading-none",
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-600",
                  )}
                >
                  {items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div
        className="pb-32 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        key={activeStatus}
      >
        {currentItems.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  currentConfig.bg,
                  currentConfig.color,
                )}
              >
                Viewing {currentItems.length} {currentConfig.label} Items
              </span>
            </div>

            {currentItems.map((item) => (
              <Card
                key={item.id}
                className="border-0 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-indigo-500/30 dark:hover:ring-indigo-400/30 transition-all duration-300 group"
              >
                <CardContent className="p-4 flex gap-4">
                  <div
                    className={cn(
                      "w-1 rounded-full shrink-0",
                      currentConfig.bg.replace("/10", "").replace("/20", ""),
                    )}
                  />

                  <div>
                    <h4 className="font-bold text-sm leading-snug text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
              <GitCommit className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-zinc-900 dark:text-zinc-100 font-medium">
              No {activeStatus.replace("-", " ")} items
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Check other tabs for updates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
