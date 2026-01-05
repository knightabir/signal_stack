import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember, ROLES } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces/[workspaceId]
 * Get workspace details
 */
export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;

    // Rate limiting
    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find workspace
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check membership
    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId: session.user.id,
    }).lean();

    if (!member) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        plan: workspace.plan,
        settings: workspace.settings,
        createdAt: workspace.createdAt,
      },
      membership: {
        role: member.role,
        joinedAt: member.joinedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]
 * Update workspace details
 */
export async function PATCH(request, { params }) {
  try {
    const { workspaceId } = await params;

    // Rate limiting
    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check membership with update permission
    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId: session.user.id,
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (!member.hasPermission('workspace:update')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, settings } = body;

    // Build update object
    const updateData = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Invalid workspace name' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }

    if (settings !== undefined) {
      updateData.settings = settings;
    }

    // Update workspace
    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      message: 'Workspace updated successfully',
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        plan: workspace.plan,
        settings: workspace.settings,
      },
    });
  } catch (error) {
    console.error('Error updating workspace:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]
 * Delete workspace (owner only) - CASCADE DELETES ALL DATA
 */
export async function DELETE(request, { params }) {
  try {
    const { workspaceId } = await params;

    // Rate limiting
    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find workspace first
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check if user is owner
    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId: session.user.id,
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    if (!member.hasPermission('workspace:delete')) {
      return NextResponse.json(
        { error: 'Only the workspace owner can delete the workspace' },
        { status: 403 }
      );
    }

    // Require confirmation (check body for confirm flag)
    const body = await request.json().catch(() => ({}));
    if (!body.confirm) {
      return NextResponse.json(
        { error: 'Confirmation required. Send { confirm: true } to proceed.' },
        { status: 400 }
      );
    }

    // Import models for cascade deletion
    const { Feedback, Vote, Comment, RoadmapItem, Announcement } = await import('@/models');

    // Audit log before deletion
    console.warn('[WORKSPACE DELETE]', {
      workspaceId: workspace._id.toString(),
      workspaceName: workspace.name,
      deletedBy: session.user.id,
      deletedAt: new Date().toISOString(),
    });

    // CASCADE DELETE ALL DATA
    const deleteResults = {
      feedback: 0,
      votes: 0,
      comments: 0,
      roadmapItems: 0,
      announcements: 0,
      members: 0,
    };

    // 1. Delete all feedback and related votes/comments
    const feedbackIds = await Feedback.find({ workspaceId }).distinct('_id');
    if (feedbackIds.length > 0) {
      const voteResult = await Vote.deleteMany({ feedbackId: { $in: feedbackIds } });
      const commentResult = await Comment.deleteMany({ feedbackId: { $in: feedbackIds } });
      deleteResults.votes = voteResult.deletedCount;
      deleteResults.comments = commentResult.deletedCount;
    }
    const feedbackResult = await Feedback.deleteMany({ workspaceId });
    deleteResults.feedback = feedbackResult.deletedCount;

    // 2. Delete roadmap items
    const roadmapResult = await RoadmapItem.deleteMany({ workspaceId });
    deleteResults.roadmapItems = roadmapResult.deletedCount;

    // 3. Delete announcements
    const announcementResult = await Announcement.deleteMany({ workspaceId });
    deleteResults.announcements = announcementResult.deletedCount;

    // 4. Delete all members
    const memberResult = await WorkspaceMember.deleteMany({ workspaceId });
    deleteResults.members = memberResult.deletedCount;

    // 5. Cancel Stripe subscription if exists
    if (workspace.stripeSubscriptionId) {
      try {
        const { cancelSubscription } = await import('@/lib/stripe');
        await cancelSubscription(workspace.stripeSubscriptionId);
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError);
        // Continue with deletion anyway
      }
    }

    // 6. Finally delete the workspace
    await Workspace.findByIdAndDelete(workspaceId);

    return NextResponse.json({
      message: 'Workspace and all data deleted successfully',
      deleted: deleteResults,
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
