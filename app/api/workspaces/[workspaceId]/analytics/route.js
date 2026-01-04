import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, Feedback, Vote, RoadmapItem, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces/[workspaceId]/analytics
 * Get workspace analytics and metrics
 */
export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find workspace
    let workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId }).lean();
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership
    const member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Time period filter
    const period = searchParams.get('period') || '30d';
    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all metrics in parallel
    const [
      totalFeedback,
      statusBreakdown,
      topVotedFeedback,
      recentVotes,
      roadmapStats,
      feedbackTrend,
    ] = await Promise.all([
      // Total feedback count
      Feedback.countDocuments({ workspaceId: workspace._id }),

      // Status breakdown
      Feedback.aggregate([
        { $match: { workspaceId: workspace._id, isHidden: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Top voted feedback
      Feedback.find({ workspaceId: workspace._id, isHidden: false })
        .sort({ voteCount: -1 })
        .limit(5)
        .select('title voteCount commentCount status createdAt')
        .lean(),

      // Recent votes (for trend)
      Vote.aggregate([
        {
          $lookup: {
            from: 'feedbacks',
            localField: 'feedbackId',
            foreignField: '_id',
            as: 'feedback',
          },
        },
        { $unwind: '$feedback' },
        { $match: { 'feedback.workspaceId': workspace._id, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Roadmap stats
      RoadmapItem.aggregate([
        { $match: { workspaceId: workspace._id } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),

      // Feedback trend (new feedback per day)
      Feedback.aggregate([
        { $match: { workspaceId: workspace._id, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Calculate feedback-to-ship time (average days from created to completed)
    const shippedFeedback = await Feedback.find({
      workspaceId: workspace._id,
      status: 'completed',
    }).select('createdAt updatedAt').lean();

    let avgShipTime = null;
    if (shippedFeedback.length > 0) {
      const totalDays = shippedFeedback.reduce((sum, f) => {
        const days = (new Date(f.updatedAt) - new Date(f.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgShipTime = Math.round(totalDays / shippedFeedback.length);
    }

    // Calculate total votes
    const totalVotes = topVotedFeedback.reduce((sum, f) => sum + f.voteCount, 0);

    // Format response
    return NextResponse.json({
      overview: {
        totalFeedback,
        totalVotes,
        avgShipTime,
        period: periodDays,
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s._id,
        count: s.count,
      })),
      roadmapBreakdown: roadmapStats.map((r) => ({
        stage: r._id,
        count: r.count,
      })),
      topVoted: topVotedFeedback.map((f) => ({
        id: f._id.toString(),
        title: f.title,
        voteCount: f.voteCount,
        commentCount: f.commentCount,
        status: f.status,
        createdAt: f.createdAt,
      })),
      voteTrend: recentVotes.map((v) => ({
        date: v._id,
        votes: v.count,
      })),
      feedbackTrend: feedbackTrend.map((f) => ({
        date: f._id,
        count: f.count,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
