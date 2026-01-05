import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Vote, Feedback, Workspace } from '@/models';
import { applyRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * POST /api/widget/[token]/vote
 * Vote on feedback via widget
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    const workspace = await Workspace.findOne({ widgetToken: token }).lean();

    if (!workspace || !workspace.settings?.widgetEnabled) {
      return NextResponse.json({ error: 'Widget not found or disabled' }, { status: 404 });
    }

    const body = await request.json();
    const { feedbackId } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId is required' }, { status: 400 });
    }

    // Verify feedback belongs to this workspace
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback || feedback.workspaceId.toString() !== workspace._id.toString()) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Get IP for anonymous voting
    const ipAddress = getClientIP(request);

    // Toggle vote
    const result = await Vote.toggleVote(feedbackId, null, ipAddress);

    return NextResponse.json({
      voted: result.voted,
      voteCount: result.voteCount,
    });
  } catch (error) {
    console.error('Error voting via widget:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
