import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Feedback, RoadmapItem, WorkspaceMember, ROADMAP_STAGES, FEEDBACK_STATUS } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/feedback/[feedbackId]/promote
 * Promote feedback to roadmap (admin only)
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

    if (!member || !member.hasPermission('roadmap:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if already on roadmap
    const existing = await RoadmapItem.findOne({ feedbackId: feedback._id });
    if (existing) {
      return NextResponse.json(
        { error: 'Feedback is already on the roadmap', roadmapItemId: existing._id.toString() },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { stage, customTitle, customDescription } = body;

    const itemStage = stage && Object.values(ROADMAP_STAGES).includes(stage)
      ? stage
      : ROADMAP_STAGES.PLANNED;

    // Get next order
    const order = await RoadmapItem.getNextOrder(feedback.workspaceId, itemStage);

    // Create roadmap item
    const item = await RoadmapItem.create({
      workspaceId: feedback.workspaceId,
      feedbackId: feedback._id,
      title: customTitle?.trim() || feedback.title,
      description: customDescription?.trim() || feedback.description,
      stage: itemStage,
      order,
      createdBy: session.user.id,
    });

    // Update feedback status to "planned"
    feedback.status = FEEDBACK_STATUS.PLANNED;
    await feedback.save();

    return NextResponse.json(
      {
        message: 'Feedback promoted to roadmap',
        item: {
          id: item._id.toString(),
          title: item.title,
          stage: item.stage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error promoting feedback:', error);
    return NextResponse.json({ error: 'Failed to promote feedback' }, { status: 500 });
  }
}
