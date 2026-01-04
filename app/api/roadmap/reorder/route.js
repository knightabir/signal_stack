import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { RoadmapItem, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/roadmap/reorder
 * Reorder roadmap items after drag & drop
 */
export async function POST(request) {
  try {
    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { itemId, newStage, newOrder } = body;

    if (!itemId || !newStage || newOrder === undefined) {
      return NextResponse.json(
        { error: 'itemId, newStage, and newOrder are required' },
        { status: 400 }
      );
    }

    // Get the item to check workspace
    const item = await RoadmapItem.findById(itemId);
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

    // Perform reorder
    const updatedItem = await RoadmapItem.reorderItems(
      item.workspaceId,
      itemId,
      newStage,
      newOrder
    );

    if (!updatedItem) {
      return NextResponse.json({ error: 'Failed to reorder' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Item reordered',
      item: {
        id: updatedItem._id.toString(),
        stage: updatedItem.stage,
        order: updatedItem.order,
      },
    });
  } catch (error) {
    console.error('Error reordering:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
