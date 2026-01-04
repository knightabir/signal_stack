import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User, Workspace, WorkspaceMember, ROLES } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces/[workspaceId]/members
 * Get all members of a workspace
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

    // Check membership
    const currentMember = await WorkspaceMember.findOne({
      workspaceId,
      userId: session.user.id,
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (!currentMember.hasPermission('members:read')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get all members
    const members = await WorkspaceMember.find({ workspaceId })
      .populate('userId', 'name email image')
      .populate('invitedBy', 'name email')
      .lean();

    const formattedMembers = members.map((m) => ({
      id: m._id.toString(),
      user: {
        id: m.userId._id.toString(),
        name: m.userId.name,
        email: m.userId.email,
        image: m.userId.image,
      },
      role: m.role,
      joinedAt: m.joinedAt,
      invitedBy: m.invitedBy
        ? {
            id: m.invitedBy._id.toString(),
            name: m.invitedBy.name,
            email: m.invitedBy.email,
          }
        : null,
    }));

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/members
 * Invite a new member to the workspace
 */
export async function POST(request, { params }) {
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

    const body = await request.json();
    const { email, role } = body;

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (role && !Object.values(ROLES).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Cannot invite as owner
    if (role === ROLES.OWNER) {
      return NextResponse.json(
        { error: 'Cannot invite as owner' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check inviter's permission
    const currentMember = await WorkspaceMember.findOne({
      workspaceId,
      userId: session.user.id,
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (!currentMember.hasPermission('members:invite')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Find user by email
    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return NextResponse.json(
        { error: 'User not found. They must create an account first.' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await WorkspaceMember.findOne({
      workspaceId,
      userId: userToInvite._id,
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 409 }
      );
    }

    // Create membership
    const member = await WorkspaceMember.create({
      workspaceId,
      userId: userToInvite._id,
      role: role || ROLES.VIEWER,
      invitedBy: session.user.id,
      invitedAt: new Date(),
      joinedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Member added successfully',
        member: {
          id: member._id.toString(),
          user: {
            id: userToInvite._id.toString(),
            name: userToInvite.name,
            email: userToInvite.email,
          },
          role: member.role,
          joinedAt: member.joinedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/members
 * Remove a member from the workspace
 */
export async function DELETE(request, { params }) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

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

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check current user's permission
    const currentMember = await WorkspaceMember.findOne({
      workspaceId,
      userId: session.user.id,
    });

    if (!currentMember) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (!currentMember.hasPermission('members:remove')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Find member to remove
    const memberToRemove = await WorkspaceMember.findById(memberId);

    if (!memberToRemove || memberToRemove.workspaceId.toString() !== workspaceId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (memberToRemove.role === ROLES.OWNER) {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      );
    }

    // Remove member
    await WorkspaceMember.findByIdAndDelete(memberId);

    return NextResponse.json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
