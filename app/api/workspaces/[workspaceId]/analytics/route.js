import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workspace, Feedback, Vote } from '@/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WorkspaceMember } from '@/models';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify membership
    const isMember = await WorkspaceMember.exists({
      workspaceId,
      userId: session.user.id,
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Total Metrics
    const totalFeedback = await Feedback.countDocuments({ workspaceId });
    const votesResult = await Vote.aggregate([
        { 
            $lookup: {
                from: 'feedbacks',
                localField: 'feedbackId',
                foreignField: '_id',
                as: 'feedback'
            }
        },
        { $unwind: '$feedback' },
        { 
            $match: { 
                'feedback.workspaceId': new mongoose.Types.ObjectId(workspaceId) 
            } 
        },
        { $count: 'total' }
    ]);
    // Since votes might not directly link to workspace except through feedback, 
    // simpler to sum voteCount on Feedback for now if we trust it, or aggreg like above.
    // Actually, `Feedback` model has `voteCount` which is denormalized. Let's use that for speed.
    
    const voteSumResult = await Feedback.aggregate([
        { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
        { $group: { _id: null, totalVotes: { $sum: '$voteCount' } } }
    ]);
    const totalVotes = voteSumResult.length > 0 ? voteSumResult[0].totalVotes : 0;

    const roadmapItems = await Feedback.countDocuments({ 
        workspaceId,
        status: { $in: ['planned', 'in-progress'] }
    });

    const doneItems = await Feedback.countDocuments({
        workspaceId,
        status: 'done'
    });

    // 2. Chart Data (Last 30 days feedback volume)
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    
    // Aggregate feedback creation by day
    const feedbackTrend = await Feedback.aggregate([
        { 
            $match: { 
                workspaceId: new mongoose.Types.ObjectId(workspaceId),
                createdAt: { $gte: thirtyDaysAgo }
            } 
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const chartData = [];
    for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = feedbackTrend.find(d => d._id === dateStr);
        chartData.unshift({
            date: format(date, 'MMM dd'),
            start: dayData ? dayData.count : 0
        });
    }

    // 3. Recent Activity (Latest 5 feedback)
    const recentFeedback = await Feedback.find({ workspaceId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title authorName createdAt status')
        .lean();

    return NextResponse.json({
        stats: {
            totalFeedback,
            totalVotes,
            roadmapItems,
            doneItems
        },
        chartData,
        recentActivity: recentFeedback.map(f => ({
            id: f._id.toString(),
            title: f.title,
            author: f.authorName || 'Anonymous',
            date: f.createdAt,
            status: f.status
        }))
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import mongoose from 'mongoose';
