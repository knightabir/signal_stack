"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Megaphone } from "lucide-react";
import { format } from "date-fns";

export function ChangelogTab({ data }) {
  const changelogItems = data.changelog || [];

  return (
    <ScrollArea className="h-full -mx-4 px-4">
      <div className="space-y-6 pb-4">
        {changelogItems.length > 0 ? (
          <div className="space-y-6 ml-2 border-l-2 border-slate-100 dark:border-slate-800 pl-6 py-2">
            {changelogItems.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800" />
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={item.createdAt}>
                    {format(
                      new Date(item.publishedAt || item.createdAt),
                      "MMMM d, yyyy"
                    )}
                  </time>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  >
                    New
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 font-sans tracking-tight">
                  {item.title}
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 prose-sm dark:prose-invert leading-relaxed font-sans">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>No updates yet.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
