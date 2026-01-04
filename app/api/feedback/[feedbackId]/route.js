import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Feedback, Vote, WorkspaceMember, FEEDBACK_STATUS } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/feedback/[feedbackId]
 * Get single feedback with details
 */
export async function GET(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'public');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId)
      .populate('authorId', 'name image')
      .populate('workspaceId', 'name slug settings')
      .lean();

    if (!feedback || feedback.isHidden) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check if user has voted
    const session = await getServerSession(authOptions);
    let hasVoted = false;

    if (session?.user?.id) {
      hasVoted = await Vote.hasVoted(feedbackId, session.user.id, null);
    }

    return NextResponse.json({
      feedback: {
        id: feedback._id.toString(),
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        voteCount: feedback.voteCount,
        commentCount: feedback.commentCount,
        hasVoted,
        author: feedback.authorId
          ? { name: feedback.authorId.name, image: feedback.authorId.image }
          : feedback.isAnonymous
          ? { name: 'Anonymous' }
          : { name: feedback.authorName || 'Guest' },
        workspace: {
          id: feedback.workspaceId._id.toString(),
          name: feedback.workspaceId.name,
          slug: feedback.workspaceId.slug,
        },
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

/**
 * PATCH /api/feedback/[feedbackId]
 * Update feedback (admin only)
 */
export async function PATCH(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: feedback.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('feedback:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status, isHidden, title, description } = body;

    // Update fields
    if (status && Object.values(FEEDBACK_STATUS).includes(status)) {
      feedback.status = status;
    }

    if (typeof isHidden === 'boolean') {
      feedback.isHidden = isHidden;
    }

    if (title !== undefined) {
      feedback.title = title.trim();
    }

    if (description !== undefined) {
      feedback.description = description.trim();
    }

    await feedback.save();

    return NextResponse.json({
      message: 'Feedback updated',
      feedback: {
        id: feedback._id.toString(),
        title: feedback.title,
        status: feedback.status,
        isHidden: feedback.isHidden,
      },
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

/**
 * DELETE /api/feedback/[feedbackId]
 * Delete feedback (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: feedback.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('feedback:delete')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete votes and feedback
    await Vote.deleteMany({ feedbackId: feedback._id });
    await Feedback.findByIdAndDelete(feedbackId);

    return NextResponse.json({ message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
