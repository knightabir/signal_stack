import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import {
  MessageSquare,
  ThumbsUp,
  Map,
  CheckCircle2,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";

async function getDashboardData(workspaceId) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workspaces/${workspaceId}/analytics`, {
            headers: {
                Cookie: (await (await import('next/headers')).cookies()).toString()
            },
            cache: 'no-store' 
        });
        
        if (!res.ok) {
            console.error("Failed to fetch analytics", await res.text());
            return null;
        }
        
        return res.json();
    } catch (e) {
        console.error("Error fetching dashboard data", e);
        return null; 
    }
}

export default async function WorkspaceDashboard({ params }) {
  const { workspaceSlug } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  await dbConnect();

  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    redirect('/');
  }

  const member = await WorkspaceMember.findOne({
    workspaceId: workspace._id,
    userId: session.user.id,
  }).lean();

  if (!member) {
    redirect('/');
  }

  const analyticsData = await getDashboardData(workspace._id);

  const stats = analyticsData?.stats || { totalFeedback: 0, totalVotes: 0, roadmapItems: 0, doneItems: 0 };
  const chartData = analyticsData?.chartData || [];
  const recentActivity = analyticsData?.recentActivity || [];

  const statCards = [
    {
      name: 'Total Feedback',
      value: stats.totalFeedback,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      name: 'Total Votes',
      value: stats.totalVotes,
      icon: ThumbsUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      name: 'In Progress',
      value: stats.roadmapItems,
      icon: Map,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      name: 'Completed',
      value: stats.doneItems,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Overview</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back! Here's what's happening in your workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/p/${workspaceSlug}`} target="_blank">
             <Button variant="outline" className="hidden md:flex gap-2">
                Public Board <ArrowUpRight className="w-4 h-4" />
             </Button>
          </Link>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
            <Card key={stat.name} className="border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {stat.name}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                       <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</div>
                    <p className="text-xs text-zinc-500 mt-1">
                        Lifetime total
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4 border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
                <CardTitle className="text-zinc-900 dark:text-zinc-100">Feedback Volume</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    New feedback submissions over the last 30 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <AnalyticsChart data={chartData} />
            </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
                <CardTitle className="text-zinc-900 dark:text-zinc-100">Recent Activity</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    Latest feedback and updates from your users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RecentActivity activities={recentActivity} />
            </CardContent>
        </Card>
      </div>

       {/* Quick Actions */}
       <div className="grid gap-4 md:grid-cols-3">
          <Link href={`/${workspaceSlug}/feedback`} className="group">
             <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Manage Feedback</CardTitle>
                   <MessageSquare className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500" />
                </CardHeader>
                <CardContent>
                   <div className="text-xs text-zinc-500 dark:text-zinc-400">Review and triage incoming feedback from users</div>
                </CardContent>
             </Card>
          </Link>
          <Link href={`/${workspaceSlug}/roadmap`} className="group">
             <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Update Roadmap</CardTitle>
                   <Map className="h-4 w-4 text-zinc-400 group-hover:text-amber-500" />
                </CardHeader>
                <CardContent>
                   <div className="text-xs text-zinc-500 dark:text-zinc-400">Plan your next big features and releases</div>
                </CardContent>
             </Card>
          </Link>
          <Link href={`/${workspaceSlug}/settings/widget`} className="group">
             <Card className="border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm hover:border-pink-400 dark:hover:border-pink-500/50 transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Widget Settings</CardTitle>
                   <Activity className="h-4 w-4 text-zinc-400 group-hover:text-pink-500" />
                </CardHeader>
                <CardContent>
                   <div className="text-xs text-zinc-500 dark:text-zinc-400">Customize appearance and install your widget</div>
                </CardContent>
             </Card>
          </Link>
       </div>
    </div>
  );
}
