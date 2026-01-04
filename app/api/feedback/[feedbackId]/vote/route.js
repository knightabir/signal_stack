import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Feedback, Vote } from '@/models';
import { applyRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * POST /api/feedback/[feedbackId]/vote
 * Toggle vote on feedback
 */
export async function POST(request, { params }) {
  try {
    const { feedbackId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback || feedback.isHidden) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const ipAddress = getClientIP(request);

    // Toggle vote
    const result = await Vote.toggleVote(feedbackId, userId, ipAddress);

    // Get updated vote count
    const updatedFeedback = await Feedback.findById(feedbackId).lean();

    return NextResponse.json({
      voted: result.voted,
      voteCount: updatedFeedback.voteCount,
    });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}

/**
 * GET /api/feedback/[feedbackId]/vote
 * Check if current user has voted
 */
export async function GET(request, { params }) {
  try {
    const { feedbackId } = await params;

    await dbConnect();

    const feedback = await Feedback.findById(feedbackId).lean();
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const ipAddress = getClientIP(request);

    const hasVoted = await Vote.hasVoted(feedbackId, userId, userId ? null : ipAddress);

    return NextResponse.json({
      hasVoted,
      voteCount: feedback.voteCount,
    });
  } catch (error) {
    console.error('Error checking vote:', error);
    return NextResponse.json({ error: 'Failed to check vote' }, { status: 500 });
  }
}
