import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
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
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/30 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-indigo-500/10 text-indigo-400 text-xs">
                {item.author.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-white">
                {item.author}{" "}
                <span className="text-slate-500 font-normal">submitted</span>{" "}
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                <span>•</span>
                <span className="capitalize text-indigo-400">
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
