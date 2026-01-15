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
          <div className="space-y-6 ml-2 border-l-2 border-slate-300 pl-6 py-2">
            {changelogItems.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-indigo-600 shadow-sm" />
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={item.createdAt}>
                    {format(
                      new Date(item.publishedAt || item.createdAt),
                      "MMMM d, yyyy"
                    )}
                  </time>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1 text-black bg-amber-100 border border-amber-300"
                  >
                    New
                  </Badge>
                </div>
                <h3 className="text-lg font-bold mb-2 font-sans tracking-tight text-black">
                  {item.title}
                </h3>
                <div className="text-sm prose-sm leading-relaxed font-sans text-slate-700">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Megaphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-slate-700">No updates yet.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
