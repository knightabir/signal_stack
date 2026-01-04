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
} from 'lucide-react';

const STATUS_COLORS = {
  new: { bg: 'bg-blue-500', text: 'text-blue-400' },
  under_review: { bg: 'bg-yellow-500', text: 'text-yellow-400' },
  planned: { bg: 'bg-purple-500', text: 'text-purple-400' },
  in_progress: { bg: 'bg-orange-500', text: 'text-orange-400' },
  completed: { bg: 'bg-green-500', text: 'text-green-400' },
  closed: { bg: 'bg-slate-500', text: 'text-slate-400' },
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
  in_progress: 'bg-yellow-500',
  shipped: 'bg-green-500',
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-400">
        Failed to load analytics
      </div>
    );
  }

  const maxVoteTrend = Math.max(...(data.voteTrend?.map((v) => v.votes) || [1]));
  const totalStatusCount = data.statusBreakdown?.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Insights into your feedback and roadmap</p>
        </div>
        <div className="inline-flex bg-slate-800 rounded-lg p-1">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
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
          color="text-blue-400"
        />
        <MetricCard
          icon={ChevronUp}
          label="Total Votes"
          value={data.overview?.totalVotes || 0}
          color="text-green-400"
        />
        <MetricCard
          icon={Clock}
          label="Avg Ship Time"
          value={data.overview?.avgShipTime ? `${data.overview.avgShipTime}d` : 'N/A'}
          color="text-purple-400"
        />
        <MetricCard
          icon={TrendingUp}
          label="Period"
          value={`${data.overview?.period || 30} days`}
          color="text-orange-400"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Feedback by Status
          </h2>
          <div className="space-y-3">
            {data.statusBreakdown?.length === 0 ? (
              <p className="text-slate-500 text-sm">No feedback yet</p>
            ) : (
              data.statusBreakdown?.map((item) => {
                const percentage = Math.round((item.count / totalStatusCount) * 100);
                const colors = STATUS_COLORS[item.status] || STATUS_COLORS.new;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={colors.text}>{STATUS_LABELS[item.status] || item.status}</span>
                      <span className="text-slate-400">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bg} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Roadmap Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            Roadmap Progress
          </h2>
          <div className="space-y-3">
            {data.roadmapBreakdown?.length === 0 ? (
              <p className="text-slate-500 text-sm">No roadmap items yet</p>
            ) : (
              data.roadmapBreakdown?.map((item) => {
                const labels = { planned: 'Planned', in_progress: 'In Progress', shipped: 'Shipped' };
                return (
                  <div key={item.stage} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[item.stage]}`} />
                    <span className="text-slate-300 flex-1">{labels[item.stage] || item.stage}</span>
                    <span className="text-2xl font-bold text-white">{item.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Vote Trend Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          Vote Activity ({period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'Last 90 days'})
        </h2>
        {data.voteTrend?.length === 0 ? (
          <p className="text-slate-500 text-sm">No vote activity in this period</p>
        ) : (
          <div className="h-40 flex items-end gap-1">
            {data.voteTrend?.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 group relative"
              >
                <div
                  className="bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all hover:from-indigo-400 hover:to-purple-400"
                  style={{ height: `${(day.votes / maxVoteTrend) * 100}%`, minHeight: '4px' }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {day.date}: {day.votes} votes
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Voted */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ChevronUp className="w-5 h-5 text-slate-400" />
          Most Voted Feedback
        </h2>
        {data.topVoted?.length === 0 ? (
          <p className="text-slate-500 text-sm">No feedback yet</p>
        ) : (
          <div className="space-y-3">
            {data.topVoted?.map((item, i) => {
              const colors = STATUS_COLORS[item.status] || STATUS_COLORS.new;
              return (
                <Link
                  key={item.id}
                  href={`/p/${workspace.slug}/feedback/${item.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                >
                  <span className="text-2xl font-bold text-slate-600 w-8">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className={colors.text}>{STATUS_LABELS[item.status]}</span>
                      <span className="text-slate-500">{item.commentCount} comments</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-400 font-medium">
                    <ChevronUp className="w-4 h-4" />
                    {item.voteCount}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-700/50 rounded-lg">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
