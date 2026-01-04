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
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// Dashboard stats placeholder
async function getWorkspaceStats(workspaceId) {
  // These will be populated in later phases
  return {
    totalFeedback: 0,
    totalVotes: 0,
    roadmapItems: 0,
    teamMembers: 1,
  };
}

export default async function WorkspaceDashboard({ params }) {
  const { workspaceSlug } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  await dbConnect();

  // Find workspace by slug
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    redirect('/');
  }

  // Check membership
  const member = await WorkspaceMember.findOne({
    workspaceId: workspace._id,
    userId: session.user.id,
  }).lean();

  if (!member) {
    redirect('/');
  }

  const stats = await getWorkspaceStats(workspace._id);

  const statCards = [
    {
      name: 'Total Feedback',
      value: stats.totalFeedback,
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Total Votes',
      value: stats.totalVotes,
      icon: ThumbsUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      name: 'Roadmap Items',
      value: stats.roadmapItems,
      icon: Map,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      name: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const quickActions = [
    {
      name: 'View Feedback',
      description: 'See what your users are saying',
      href: `/${workspaceSlug}/feedback`,
      icon: MessageSquare,
    },
    {
      name: 'Manage Roadmap',
      description: 'Plan and prioritize features',
      href: `/${workspaceSlug}/roadmap`,
      icon: Map,
    },
    {
      name: 'Invite Team',
      description: 'Collaborate with your team',
      href: `/${workspaceSlug}/team`,
      icon: Users,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to {workspace.name}
        </h1>
        <p className="text-slate-400">
          Here&apos;s an overview of your product feedback and roadmap.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
          >
            <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
              <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ stroke: 'url(#gradient)' }} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{action.name}</p>
                    <p className="text-xs text-slate-400">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-emerald-400">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Create your workspace</p>
                <p className="text-xs text-slate-400 mt-1">
                  You&apos;ve set up your workspace. Great start!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-slate-400">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Collect your first feedback</p>
                <p className="text-xs text-slate-400 mt-1">
                  Share your feedback board with users to start collecting insights.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-slate-400">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Build your roadmap</p>
                <p className="text-xs text-slate-400 mt-1">
                  Turn feedback into roadmap items and share your product direction.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-slate-400">4</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Announce updates</p>
                <p className="text-xs text-slate-400 mt-1">
                  Close the loop by announcing shipped features to your users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Board Link */}
      <div className="mt-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Your Public Feedback Board</h3>
            <p className="text-sm text-slate-400">
              Share this link with your users to collect feedback
            </p>
          </div>
          <div className="flex items-center gap-3">
            <code className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-indigo-400 border border-slate-700">
              /p/{workspaceSlug}
            </code>
            <Link
              href={`/p/${workspaceSlug}`}
              target="_blank"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
