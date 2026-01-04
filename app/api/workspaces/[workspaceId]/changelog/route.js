import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, Announcement, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces/[workspaceId]/changelog
 * List announcements (public shows published only)
 */
export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);

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

    // Check if admin (to show drafts)
    const session = await getServerSession(authOptions);
    let isAdmin = false;

    if (session?.user?.id) {
      const member = await WorkspaceMember.findOne({
        workspaceId: workspace._id,
        userId: session.user.id,
      });
      isAdmin = member && member.hasPermission('changelog:read');
    }

    // Query
    const includeDrafts = searchParams.get('drafts') === 'true' && isAdmin;

    const query = { workspaceId: workspace._id };
    if (!includeDrafts) {
      query.isPublished = true;
    }

    const announcements = await Announcement.find(query)
      .populate('linkedFeedbackIds', 'title voteCount')
      .populate('linkedRoadmapIds', 'title stage')
      .populate('createdBy', 'name')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        slug: a.slug,
        content: a.content,
        isPublished: a.isPublished,
        publishedAt: a.publishedAt,
        linkedFeedback: a.linkedFeedbackIds?.map((f) => ({
          id: f._id.toString(),
          title: f.title,
          voteCount: f.voteCount,
        })) || [],
        linkedRoadmap: a.linkedRoadmapIds?.map((r) => ({
          id: r._id.toString(),
          title: r.title,
          stage: r.stage,
        })) || [],
        createdBy: a.createdBy?.name || 'Unknown',
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/changelog
 * Create new announcement (admin only)
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

    if (!member || !member.hasPermission('changelog:create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, isPublished, linkedFeedbackIds, linkedRoadmapIds } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug
    const slug = await Announcement.generateSlug(workspace._id, title.trim());

    // Create announcement
    const announcement = await Announcement.create({
      workspaceId: workspace._id,
      title: title.trim(),
      slug,
      content: content?.trim() || '',
      isPublished: isPublished || false,
      linkedFeedbackIds: linkedFeedbackIds || [],
      linkedRoadmapIds: linkedRoadmapIds || [],
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        message: 'Announcement created',
        announcement: {
          id: announcement._id.toString(),
          title: announcement.title,
          slug: announcement.slug,
          isPublished: announcement.isPublished,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
