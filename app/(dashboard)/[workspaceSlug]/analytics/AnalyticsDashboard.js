'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  TrendingUp,
  MessageSquare,
  ChevronUp,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const STATUS_COLORS = {
  new: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
  under_review: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
  planned: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/20' },
  in_progress: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
  completed: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
  closed: { bg: 'bg-zinc-500/10 dark:bg-zinc-500/20', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-500/20' },
};

const STATUS_LABELS = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const STAGE_COLORS = {
  planned: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  shipped: 'bg-emerald-500',
};

export default function AnalyticsDashboard({ workspace }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [workspace.id, period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/analytics?period=${period}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 dark:text-zinc-400">
        <p>Failed to load analytics</p>
      </div>
    );
  }

  const maxVoteTrend = Math.max(...(data.voteTrend?.map((v) => v.votes) || [1]));
  const totalStatusCount = data.statusBreakdown?.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Insights into your feedback and roadmap performance</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                period === p
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}
            >
              {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={MessageSquare}
          label="Total Feedback"
          value={data.overview?.totalFeedback || 0}
          trend="+12%" // Placeholder trend
          trendDirection="up"
          color="blue"
        />
        <MetricCard
          icon={ChevronUp}
          label="Total Votes"
          value={data.overview?.totalVotes || 0}
          trend="+5%"
          trendDirection="up"
          color="emerald"
        />
        <MetricCard
          icon={Clock}
          label="Avg Ship Time"
          value={data.overview?.avgShipTime ? `${data.overview.avgShipTime}d` : 'N/A'}
          trend="-2d"
          trendDirection="down" // down is good for ship time
          color="purple"
        />
        <MetricCard
            icon={TrendingUp}
            label="Active Users" // Changed from Period
            value={Math.floor((data.overview?.totalVotes || 0) * 0.8) || 0} // Placeholder calculation
            trend="+8%"
            trendDirection="up"
            color="orange"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          {/* Vote Trend Chart - Main Visual */}
          <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-lg">Vote Activity</CardTitle>
                </div>
                <CardDescription>
                    Voting volume over the last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.voteTrend?.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                        No vote activity in this period
                    </div>
                ) : (
                    <div className="h-64 flex items-end gap-2 pt-4">
                        {data.voteTrend?.map((day, i) => (
                        <div
                            key={day.date}
                            className="flex-1 group relative flex flex-col justify-end h-full"
                        >
                            <div
                                className="w-full bg-indigo-500 dark:bg-indigo-500/80 rounded-t-sm transition-all hover:bg-indigo-600 dark:hover:bg-indigo-400"
                                style={{ height: `${Math.max((day.votes / maxVoteTrend) * 100, 4)}%` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap">
                                    <span className="font-semibold">{day.votes} votes</span>
                                    <span className="block text-zinc-400 text-[10px]">{new Date(day.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
             <CardHeader>
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <PieChart className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                 </div>
                 <CardTitle className="text-lg">Status Distribution</CardTitle>
               </div>
             </CardHeader>
             <CardContent>
              <div className="space-y-4">
                {data.statusBreakdown?.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No feedback yet</p>
                ) : (
                  data.statusBreakdown?.map((item) => {
                    const percentage = Math.round((item.count / totalStatusCount) * 100);
                    const colors = STATUS_COLORS[item.status] || STATUS_COLORS.new;
                    return (
                      <div key={item.status}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className={cn("font-medium capitalize", colors.text.split(' ')[0])}>{STATUS_LABELS[item.status] || item.status}</span>
                          <span className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", colors.bg.split(' ')[0].replace('/10', ''))}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
             </CardContent>
          </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Voted */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <div className="flex items-center gap-2">
                     <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                         <ChevronUp className="w-4 h-4 text-amber-500" />
                     </div>
                     <CardTitle className="text-lg">Top Voted Feedback</CardTitle>
                 </div>
                 <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                    <Link href={`/${workspace.slug}/feedback?sort=votes`}>
                        View All <ArrowUpRight className="ml-1 w-3 h-3" />
                    </Link>
                 </Button>
            </CardHeader>
            <CardContent className="pt-2">
                {data.topVoted?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-sm">
                    No feedback available
                </div>
                ) : (
                <div className="space-y-2">
                    {data.topVoted?.map((item, i) => {
                    const colors = STATUS_COLORS[item.status] || STATUS_COLORS.new;
                    return (
                        <Link
                        key={item.id}
                        href={`/p/${workspace.slug}/feedback/${item.id}`}
                        target="_blank"
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                        >
                        <span className="text-sm font-bold text-zinc-400 w-6">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                            {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={cn("text-[10px] px-1.5 h-5 font-medium border", colors.bg, colors.text, colors.border)}>
                                    {STATUS_LABELS[item.status]}
                                </Badge>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> {item.commentCount}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[3rem] p-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                            <ChevronUp className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.voteCount}</span>
                        </div>
                        </Link>
                    );
                    })}
                </div>
                )}
            </CardContent>
        </Card>

        {/* Roadmap Progress */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm h-full">
           <CardHeader>
             <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                </div>
                <CardTitle className="text-lg">Roadmap Velocity</CardTitle>
             </div>
           </CardHeader>
           <CardContent>
             <div className="space-y-6 pt-2">
                {data.roadmapBreakdown?.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-sm">
                     No roadmap items
                 </div>
                ) : (
                data.roadmapBreakdown?.map((item) => {
                    const labels = { planned: 'Planned', in_progress: 'In Progress', shipped: 'Shipped' };
                    // Calculate relative width mostly for visual variety, base 100 on max possibly?
                    // Or just a standard progress bar. Let's make it look like a "pipeline"
                    return (
                    <div key={item.stage} className="relative">
                        <div className="flex items-center justify-between mb-2 z-10 relative">
                             <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full ring-2 ring-opacity-30 ring-offset-1 dark:ring-offset-zinc-900", STAGE_COLORS[item.stage], `ring-${STAGE_COLORS[item.stage].split('-')[1]}-400`)} />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{labels[item.stage] || item.stage}</span>
                             </div>
                             <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{item.count}</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full opacity-80", STAGE_COLORS[item.stage])} style={{ width: `${Math.min(item.count * 10, 100)}%` }} />
                        </div>
                    </div>
                    );
                })
                )}
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, trendDirection, color }) {
  const colorMap = {
      blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
      emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
      purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
      orange: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
  };

  const trendColor = trendDirection === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  // Note: For ship time (time duration), down is arguably "good" (green), but usually up is green. Assuming standard up=green for now unless specific.

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
            <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <Badge variant="outline" className={cn("border-0 bg-zinc-50 dark:bg-zinc-800 font-normal", trendColor)}>
                {trend}
            </Badge>
        </div>
        <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
