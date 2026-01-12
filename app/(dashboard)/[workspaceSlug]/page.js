import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import {
  MessageSquare,
  ThumbsUp,
  Map,
  Users,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

// Helper to fetch data directly (simulating API call for Server Component efficiency)
// In a real scenario we might call the service layer directly instead of fetch(url) to avoid network overhead on same server.
// But for now, we'll import the logic or fetch the absolute URL if needed.
// Better practice: Refactor the logic from route.js into a service/lib function and call it here.
async function getDashboardData(workspaceId) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workspaces/${workspaceId}/analytics`, {
            headers: {
                // Forward the cookie for auth check
                Cookie: (await (await import('next/headers')).cookies()).toString()
            },
            cache: 'no-store' // Metrics should be fresh
        });
        
        if (!res.ok) {
            console.error("Failed to fetch analytics", await res.text());
            return null;
        }
        
        return res.json();
    } catch (e) {
        console.error("Error fetching dashboard data", e);
        return null; // Fallback
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

  // Fallback data if API fails or returns empty
  const stats = analyticsData?.stats || { totalFeedback: 0, totalVotes: 0, roadmapItems: 0, doneItems: 0 };
  const chartData = analyticsData?.chartData || [];
  const recentActivity = analyticsData?.recentActivity || [];

  const statCards = [
    {
      name: 'Total Feedback',
      value: stats.totalFeedback,
      icon: MessageSquare,
      color: 'text-blue-500',
    },
    {
      name: 'Total Votes',
      value: stats.totalVotes,
      icon: ThumbsUp,
      color: 'text-purple-500',
    },
    {
      name: 'In Progress',
      value: stats.roadmapItems,
      icon: Map,
      color: 'text-amber-500',
    },
    {
      name: 'Completed',
      value: stats.doneItems,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href={`/p/${workspaceSlug}`} target="_blank">
            <div className="hidden md:flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors">
                View Public Board
            </div>
          </Link>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
            <Card key={stat.name} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">
                        {stat.name}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        +12% from last month
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4 bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-white">Feedback Volume</CardTitle>
                <CardDescription>
                    New feedback submissions over the last 30 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <AnalyticsChart data={chartData} />
            </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription>
                    Latest feedback and updates from your users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RecentActivity activities={recentActivity} />
            </CardContent>
        </Card>
      </div>

       {/* Quick Actions */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href={`/${workspaceSlug}/feedback`} className="group">
             <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-700/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">Manage Feedback</CardTitle>
                   <MessageSquare className="h-4 w-4 text-slate-400 group-hover:text-indigo-400" />
                </CardHeader>
                <CardContent>
                   <div className="text-xs text-slate-500">Review and triage incoming feedback</div>
                </CardContent>
             </Card>
          </Link>
          <Link href={`/${workspaceSlug}/roadmap`} className="group">
             <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-700/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">Update Roadmap</CardTitle>
                   <Map className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                </CardHeader>
                <CardContent>
                   <div className="text-xs text-slate-500">Plan your next big features</div>
                </CardContent>
             </Card>
          </Link>
          <Link href={`/${workspaceSlug}/settings/widget`} className="group">
             <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-700/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium text-white group-hover:text-pink-400 transition-colors">Widget Settings</CardTitle>
                   <Activity className="h-4 w-4 text-slate-400 group-hover:text-pink-400" />
                </CardHeader>
                <CardContent>
                   <div className="text-xs text-slate-500">Customize your feedback widget</div>
                </CardContent>
             </Card>
          </Link>
       </div>
    </div>
  );
}
