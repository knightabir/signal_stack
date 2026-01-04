import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, RoadmapItem, WorkspaceMember, ROADMAP_STAGES } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces/[workspaceId]/roadmap
 * List roadmap items (public)
 */
export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'public');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    // Find workspace by ID or slug
    let workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId }).lean();
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get all roadmap items grouped by stage
    const items = await RoadmapItem.find({ workspaceId: workspace._id })
      .populate('feedbackId', 'title voteCount commentCount status')
      .populate('createdBy', 'name')
      .sort({ order: 1 })
      .lean();

    // Group by stage
    const roadmap = {
      [ROADMAP_STAGES.PLANNED]: [],
      [ROADMAP_STAGES.IN_PROGRESS]: [],
      [ROADMAP_STAGES.SHIPPED]: [],
    };

    items.forEach((item) => {
      roadmap[item.stage].push({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        stage: item.stage,
        order: item.order,
        feedback: item.feedbackId
          ? {
              id: item.feedbackId._id.toString(),
              title: item.feedbackId.title,
              voteCount: item.feedbackId.voteCount,
              commentCount: item.feedbackId.commentCount,
            }
          : null,
        createdBy: item.createdBy?.name || 'Unknown',
        createdAt: item.createdAt,
      });
    });

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/roadmap
 * Create new roadmap item (admin only)
 */
export async function POST(request, { params }) {
  try {
    const { workspaceId } = await params;

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

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('roadmap:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, stage } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const itemStage = stage && Object.values(ROADMAP_STAGES).includes(stage)
      ? stage
      : ROADMAP_STAGES.PLANNED;

    // Get next order number
    const order = await RoadmapItem.getNextOrder(workspace._id, itemStage);

    // Create item
    const item = await RoadmapItem.create({
      workspaceId: workspace._id,
      title: title.trim(),
      description: description?.trim() || '',
      stage: itemStage,
      order,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        message: 'Roadmap item created',
        item: {
          id: item._id.toString(),
          title: item.title,
          stage: item.stage,
          order: item.order,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating roadmap item:', error);
    return NextResponse.json({ error: 'Failed to create roadmap item' }, { status: 500 });
  }
}
