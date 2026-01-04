import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { RoadmapItem, WorkspaceMember, ROADMAP_STAGES } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/roadmap/[roadmapId]
 * Get single roadmap item
 */
export async function GET(request, { params }) {
  try {
    const { roadmapId } = await params;

    await dbConnect();

    const item = await RoadmapItem.findById(roadmapId)
      .populate('feedbackId', 'title description voteCount commentCount status')
      .populate('createdBy', 'name')
      .populate('workspaceId', 'name slug')
      .lean();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({
      item: {
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        stage: item.stage,
        order: item.order,
        feedback: item.feedbackId
          ? {
              id: item.feedbackId._id.toString(),
              title: item.feedbackId.title,
              description: item.feedbackId.description,
              voteCount: item.feedbackId.voteCount,
              commentCount: item.feedbackId.commentCount,
            }
          : null,
        workspace: {
          id: item.workspaceId._id.toString(),
          name: item.workspaceId.name,
          slug: item.workspaceId.slug,
        },
        createdBy: item.createdBy?.name || 'Unknown',
        createdAt: item.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching roadmap item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

/**
 * PATCH /api/roadmap/[roadmapId]
 * Update roadmap item (admin only)
 */
export async function PATCH(request, { params }) {
  try {
    const { roadmapId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const item = await RoadmapItem.findById(roadmapId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: item.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('roadmap:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, stage } = body;

    if (title !== undefined) {
      item.title = title.trim();
    }

    if (description !== undefined) {
      item.description = description.trim();
    }

    if (stage && Object.values(ROADMAP_STAGES).includes(stage)) {
      if (stage !== item.stage) {
        // Moving to a new stage - get new order
        const newOrder = await RoadmapItem.getNextOrder(item.workspaceId, stage);
        item.stage = stage;
        item.order = newOrder;
      }
    }

    await item.save();

    return NextResponse.json({
      message: 'Item updated',
      item: {
        id: item._id.toString(),
        title: item.title,
        stage: item.stage,
      },
    });
  } catch (error) {
    console.error('Error updating roadmap item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

/**
 * DELETE /api/roadmap/[roadmapId]
 * Delete roadmap item (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const { roadmapId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const item = await RoadmapItem.findById(roadmapId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: item.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('roadmap:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete and reorder remaining items
    await RoadmapItem.updateMany(
      { workspaceId: item.workspaceId, stage: item.stage, order: { $gt: item.order } },
      { $inc: { order: -1 } }
    );

    await RoadmapItem.findByIdAndDelete(roadmapId);

    return NextResponse.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting roadmap item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
