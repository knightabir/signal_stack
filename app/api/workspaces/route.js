import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember, ROLES } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces
 * Get all workspaces for the current user
 */
export async function GET(request) {
  try {
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

    // Get all workspaces where user is a member
    const memberships = await WorkspaceMember.find({ userId: session.user.id })
      .populate('workspaceId')
      .lean();

    const workspaces = memberships
      .filter((m) => m.workspaceId) // Filter out any null workspaces
      .map((m) => ({
        id: m.workspaceId._id.toString(),
        name: m.workspaceId.name,
        slug: m.workspaceId.slug,
        description: m.workspaceId.description,
        plan: m.workspaceId.plan,
        role: m.role,
        joinedAt: m.joinedAt,
        settings: m.workspaceId.settings,
      }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export async function POST(request) {
  try {
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
    const { name, description } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Workspace name cannot exceed 100 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate unique slug
    const slug = await Workspace.generateUniqueSlug(name.trim());

    // Create workspace
    const workspace = await Workspace.create({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      ownerId: session.user.id,
    });

    // Add creator as owner
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: session.user.id,
      role: ROLES.OWNER,
      joinedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Workspace created successfully',
        workspace: {
          id: workspace._id.toString(),
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
          plan: workspace.plan,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workspace:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
