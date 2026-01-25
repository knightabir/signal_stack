import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        No recent activity
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-4 pr-4">
        {activities.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-700">
              <AvatarFallback className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                {item.author.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
                {item.author}{" "}
                <span className="text-zinc-500 font-normal">submitted</span>{" "}
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                <span>•</span>
                <span className="capitalize text-indigo-600 dark:text-indigo-400 font-medium">
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
