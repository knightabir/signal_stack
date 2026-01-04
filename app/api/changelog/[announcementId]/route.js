import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Announcement, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/changelog/[announcementId]
 * Get single announcement
 */
export async function GET(request, { params }) {
  try {
    const { announcementId } = await params;

    await dbConnect();

    const announcement = await Announcement.findById(announcementId)
      .populate('linkedFeedbackIds', 'title voteCount commentCount')
      .populate('linkedRoadmapIds', 'title stage')
      .populate('workspaceId', 'name slug')
      .populate('createdBy', 'name')
      .lean();

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check if public access is allowed
    const session = await getServerSession(authOptions);
    const isAuthor = session?.user?.id === announcement.createdBy?._id?.toString();

    if (!announcement.isPublished && !isAuthor) {
      // Check if admin
      if (session?.user?.id) {
        const member = await WorkspaceMember.findOne({
          workspaceId: announcement.workspaceId._id,
          userId: session.user.id,
        });
        if (!member || !member.hasPermission('changelog:read')) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    return NextResponse.json({
      announcement: {
        id: announcement._id.toString(),
        title: announcement.title,
        slug: announcement.slug,
        content: announcement.content,
        isPublished: announcement.isPublished,
        publishedAt: announcement.publishedAt,
        linkedFeedback: announcement.linkedFeedbackIds?.map((f) => ({
          id: f._id.toString(),
          title: f.title,
          voteCount: f.voteCount,
          commentCount: f.commentCount,
        })) || [],
        linkedRoadmap: announcement.linkedRoadmapIds?.map((r) => ({
          id: r._id.toString(),
          title: r.title,
          stage: r.stage,
        })) || [],
        workspace: {
          id: announcement.workspaceId._id.toString(),
          name: announcement.workspaceId.name,
          slug: announcement.workspaceId.slug,
        },
        createdBy: announcement.createdBy?.name || 'Unknown',
        createdAt: announcement.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

/**
 * PATCH /api/changelog/[announcementId]
 * Update announcement (admin only)
 */
export async function PATCH(request, { params }) {
  try {
    const { announcementId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: announcement.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('changelog:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, isPublished, linkedFeedbackIds, linkedRoadmapIds } = body;

    if (title !== undefined) {
      announcement.title = title.trim();
    }

    if (content !== undefined) {
      announcement.content = content.trim();
    }

    if (typeof isPublished === 'boolean') {
      announcement.isPublished = isPublished;
    }

    if (linkedFeedbackIds !== undefined) {
      announcement.linkedFeedbackIds = linkedFeedbackIds;
    }

    if (linkedRoadmapIds !== undefined) {
      announcement.linkedRoadmapIds = linkedRoadmapIds;
    }

    await announcement.save();

    return NextResponse.json({
      message: 'Announcement updated',
      announcement: {
        id: announcement._id.toString(),
        title: announcement.title,
        isPublished: announcement.isPublished,
      },
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

/**
 * DELETE /api/changelog/[announcementId]
 * Delete announcement (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const { announcementId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: announcement.workspaceId,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('changelog:delete')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await Announcement.findByIdAndDelete(announcementId);

    return NextResponse.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
