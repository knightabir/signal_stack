"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Megaphone, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ChangelogTab({ data, isDark }) {
  const changelogItems = data.changelog || [];

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between shrink-0 mb-4 px-1">
        <h3 className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
          Product Updates
        </h3>
      </div>

      {changelogItems.length > 0 ? (
        <div className="relative pl-4 space-y-8 py-2">
          {/* Timeline Line */}
          <div className="absolute left-0 top-3 bottom-3 w-px bg-zinc-200 dark:bg-zinc-800" />

          {changelogItems.map((item, index) => (
            <div key={item.id} className="relative pl-6">
              {/* Timeline Dot */}
              <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full ring-4 ring-zinc-50 dark:ring-zinc-950 bg-indigo-500" />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20"
                  >
                    {format(
                      new Date(item.publishedAt || item.createdAt),
                      "MMM d, yyyy",
                    )}
                  </Badge>
                  {index === 0 && (
                    <Badge className="text-[10px] h-5 px-2 bg-emerald-500 text-white border-0 shadow-sm shadow-emerald-500/20">
                      New
                    </Badge>
                  )}
                </div>

                <div className="group">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="prose prose-sm dark:prose-invert prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 leading-relaxed">
                    {item.description}
                  </div>
                </div>

                {/* Optional: Add "Read more" link if we had full content page */}
                {/* <div className="pt-1">
                    <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:gap-1.5 transition-all">
                      Read full update <ArrowRight className="w-3 h-3" />
                    </button>
                 </div> */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
            <Megaphone className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-zinc-900 dark:text-zinc-100 font-medium">
            No updates yet
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            We'll post new features and improvements here.
          </p>
        </div>
      )}
    </div>
  );
}
