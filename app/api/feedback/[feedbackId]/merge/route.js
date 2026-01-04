import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Feedback, Vote, Comment, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/feedback/[feedbackId]/merge
 * Merge duplicate feedback (admin only)
 */
export async function POST(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetId } = body;

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target feedback ID is required' },
        { status: 400 }
      );
    }

    if (targetId === feedbackId) {
      return NextResponse.json(
        { error: 'Cannot merge feedback into itself' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get both feedback items
    const [sourceFeedback, targetFeedback] = await Promise.all([
      Feedback.findById(feedbackId),
      Feedback.findById(targetId),
    ]);

    if (!sourceFeedback) {
      return NextResponse.json({ error: 'Source feedback not found' }, { status: 404 });
    }

    if (!targetFeedback) {
      return NextResponse.json({ error: 'Target feedback not found' }, { status: 404 });
    }

    // Verify same workspace
    if (sourceFeedback.workspaceId.toString() !== targetFeedback.workspaceId.toString()) {
      return NextResponse.json(
        { error: 'Cannot merge feedback from different workspaces' },
        { status: 400 }
      );
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: sourceFeedback.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('feedback:moderate')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Transfer votes to target (only unique users)
    const sourceVotes = await Vote.find({ feedbackId: sourceFeedback._id });

    for (const vote of sourceVotes) {
      // Check if user already voted on target
      const existingVote = vote.userId
        ? await Vote.findOne({ feedbackId: targetId, userId: vote.userId })
        : await Vote.findOne({ feedbackId: targetId, ipAddress: vote.ipAddress });

      if (!existingVote) {
        await Vote.create({
          feedbackId: targetId,
          userId: vote.userId,
          ipAddress: vote.ipAddress,
        });
      }
    }

    // Update target vote count
    const newVoteCount = await Vote.countDocuments({ feedbackId: targetId });
    targetFeedback.voteCount = newVoteCount;
    await targetFeedback.save();

    // Move comments to target
    await Comment.updateMany(
      { feedbackId: sourceFeedback._id },
      { feedbackId: targetId }
    );

    // Update target comment count
    const newCommentCount = await Comment.countDocuments({
      feedbackId: targetId,
      isDeleted: false,
    });
    targetFeedback.commentCount = newCommentCount;
    await targetFeedback.save();

    // Mark source as merged
    sourceFeedback.mergedIntoId = targetId;
    sourceFeedback.isHidden = true;
    await sourceFeedback.save();

    // Delete source votes
    await Vote.deleteMany({ feedbackId: sourceFeedback._id });

    return NextResponse.json({
      message: 'Feedback merged successfully',
      source: {
        id: sourceFeedback._id.toString(),
        mergedInto: targetId,
      },
      target: {
        id: targetFeedback._id.toString(),
        voteCount: targetFeedback.voteCount,
        commentCount: targetFeedback.commentCount,
      },
    });
  } catch (error) {
    console.error('Error merging feedback:', error);
    return NextResponse.json({ error: 'Failed to merge feedback' }, { status: 500 });
  }
}
