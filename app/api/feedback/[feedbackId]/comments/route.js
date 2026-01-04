import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Feedback, Comment, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/feedback/[feedbackId]/comments
 * Get threaded comments for feedback
 */
export async function GET(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'public');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId).lean();
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const comments = await Comment.getThreadedComments(feedbackId);

    // Format comments
    const formatComment = (comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      isOfficial: comment.isOfficial,
      author: {
        id: comment.authorId._id.toString(),
        name: comment.authorId.name,
        image: comment.authorId.image,
      },
      createdAt: comment.createdAt,
      replies: comment.replies?.map(formatComment) || [],
    });

    return NextResponse.json({
      comments: comments.map(formatComment),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

/**
 * POST /api/feedback/[feedbackId]/comments
 * Add a comment (requires auth)
 */
export async function POST(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to comment' },
        { status: 401 }
      );
    }

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback || feedback.isHidden) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Check if reply to existing comment
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || parentComment.feedbackId.toString() !== feedbackId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Check if user is admin (for official flag)
    const member = await WorkspaceMember.findOne({
      workspaceId: feedback.workspaceId,
      userId: session.user.id,
    });

    const isAdmin = member && member.hasPermission('feedback:update');

    // Create comment
    const comment = await Comment.create({
      feedbackId,
      parentId: parentId || null,
      authorId: session.user.id,
      content: content.trim(),
      isOfficial: isAdmin && body.isOfficial,
    });

    // Populate author for response
    await comment.populate('authorId', 'name image');

    return NextResponse.json(
      {
        message: 'Comment added',
        comment: {
          id: comment._id.toString(),
          content: comment.content,
          isOfficial: comment.isOfficial,
          author: {
            id: comment.authorId._id.toString(),
            name: comment.authorId.name,
            image: comment.authorId.image,
          },
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
