import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Subscription, Workspace, User } from '@/models';

/**
 * GET /api/admin/subscriptions
 * Get subscription analytics for super admin
 * 
 * Query params:
 * - key: Admin API key (from env ADMIN_API_KEY)
 */
export async function GET(request) {
  try {
    // Simple API key auth for admin endpoints
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    
    // Check admin API key OR authenticated super admin user
    const session = await getServerSession(authOptions);
    const isAdminKey = apiKey && apiKey === process.env.ADMIN_API_KEY;
    const isSuperAdmin = session?.user?.email === process.env.SUPER_ADMIN_EMAIL;

    if (!isAdminKey && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get revenue analytics
    const analytics = await Subscription.getRevenueAnalytics();

    // Get additional stats
    const [
      totalWorkspaces,
      totalUsers,
      workspacesByPlan,
    ] = await Promise.all([
      Workspace.countDocuments(),
      User.countDocuments(),
      Workspace.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      revenue: {
        mrr: analytics.totalMRR,
        mrrFormatted: `$${(analytics.totalMRR / 100).toFixed(2)}`,
        arr: analytics.totalARR,
        arrFormatted: `$${(analytics.totalARR / 100).toFixed(2)}`,
      },
      subscriptions: {
        active: analytics.activeSubscriptions,
        byPlan: analytics.planBreakdown,
        byInterval: analytics.intervalBreakdown,
        recent: analytics.recentSubscriptions.map(sub => ({
          id: sub._id.toString(),
          workspace: sub.workspaceId?.name || 'Unknown',
          plan: sub.plan,
          interval: sub.billingInterval,
          mrr: sub.mrr,
          mrrFormatted: `$${(sub.mrr / 100).toFixed(2)}`,
          status: sub.status,
          createdAt: sub.createdAt,
        })),
      },
      workspaces: {
        total: totalWorkspaces,
        byPlan: workspacesByPlan.reduce((acc, item) => {
          acc[item._id || 'free'] = item.count;
          return acc;
        }, {}),
      },
      users: {
        total: totalUsers,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
