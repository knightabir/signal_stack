"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export function RoadmapTab({ data, primaryColor }) {
  // Use the structured roadmap data from API
  const roadmapItems = {
    planned: data.roadmap?.planned || [],
    "in-progress": data.roadmap?.in_progress || [], // in_progress vs in-progress consistency
    done: data.roadmap?.shipped || [],
  };

  const statusConfig = {
    planned: {
      label: "Planned",
      icon: Circle,
      color: "text-amber-500 bg-amber-500",
    },
    "in-progress": {
      label: "In Progress",
      icon: Clock,
      color: "text-blue-500 bg-blue-500",
    },
    done: {
      label: "Completed",
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500",
    },
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="flex flex-row h-full min-w-full px-4 gap-4 pb-4">
          {Object.entries(roadmapItems).map(([status, items]) => {
            const config = statusConfig[status];
            const Icon = config?.icon || Circle;
            // Items for this column
            const columnItems = items || [];

            return (
              <div
                key={status}
                className="flex-1 min-w-[220px] max-w-[280px] h-full flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 py-3 bg-white z-10 border-b border-slate-200">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      config?.color ? config.color.split(" ")[0] : ""
                    )}
                  />
                  <h3 className="font-semibold text-sm whitespace-nowrap text-black">
                    {config?.label}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-xs h-5 px-1.5 min-w-[1.25rem] justify-center bg-slate-100 text-slate-700"
                  >
                    {columnItems.length}
                  </Badge>
                </div>

                {/* Column Items */}
                <div className="flex-1 flex flex-col gap-3 py-2 overflow-y-auto">
                  {columnItems.length > 0 ? (
                    columnItems.map((item) => (
                      <Card
                        key={item.id}
                        className="border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-sm"
                      >
                        <CardContent className="p-3 space-y-2">
                          <h4 className="font-bold text-sm leading-tight text-black font-sans">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-slate-700 line-clamp-3 font-sans leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            {/* Show votes if relevant, or other metadata */}
                            {/* If we have vote info in item, show it. Roadmap items from aggregation might miss 'voteCount' unless included. API includes it? 
                                            Let's check API. API creates 'roadmap' objects with 'title', 'description', 'stage', 'order'. Missing 'voteCount'?
                                            The 'RoadmapItem' model doesn't have 'voteCount'. It has link to 'feedbackId'. 
                                            If we want votes, we need to populate. For now, omit votes? Or use mocked? 
                                            The previous code assumed 'voteCount' existed. Let's omit for clean look or handle gently.
                                        */}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-600 border border-slate-300 border-dashed rounded-lg">
                      <p className="text-xs">No items</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
