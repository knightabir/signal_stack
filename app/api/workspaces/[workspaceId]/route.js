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
 * Delete workspace (owner only)
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

    // Check if user is owner
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

    if (!member.hasPermission('workspace:delete')) {
      return NextResponse.json(
        { error: 'Only the workspace owner can delete the workspace' },
        { status: 403 }
      );
    }

    // Delete all members
    await WorkspaceMember.deleteMany({ workspaceId });

    // Delete workspace
    await Workspace.findByIdAndDelete(workspaceId);

    // TODO: In later phases, also delete:
    // - Feedback items
    // - Roadmap items
    // - Changelog entries
    // - Cancel Stripe subscription

    return NextResponse.json({
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
