import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User, Workspace, WorkspaceMember, ROLES } from '@/models';

// Reserved slugs that cannot be used as workspace URLs
const RESERVED_SLUGS = [
  'api', 'sign-in', 'sign-up', 'onboarding', 'settings', 'admin',
  'dashboard', 'app', 'www', 'mail', 'ftp', 'localhost', 'signalstack',
  'feedback', 'roadmap', 'changelog', 'widget', 'embed', 'public', 'p',
];

/**
 * GET /api/onboarding
 * Check onboarding status
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has any workspace
    const membership = await WorkspaceMember.findOne({ userId: session.user.id })
      .populate('workspaceId')
      .lean();

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted,
      hasWorkspace: !!membership,
      workspace: membership?.workspaceId ? {
        id: membership.workspaceId._id.toString(),
        name: membership.workspaceId.name,
        slug: membership.workspaceId.slug,
      } : null,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/onboarding
 * Complete onboarding with workspace creation
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceUrl, workspaceName, language, companySize, team } = body;

    // Validation
    if (!workspaceUrl || !workspaceName || !language || !companySize || !team) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate workspace URL format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(workspaceUrl)) {
      return NextResponse.json(
        { error: 'Workspace URL can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (workspaceUrl.length < 3 || workspaceUrl.length > 50) {
      return NextResponse.json(
        { error: 'Workspace URL must be between 3 and 50 characters' },
        { status: 400 }
      );
    }

    // Check reserved slugs
    if (RESERVED_SLUGS.includes(workspaceUrl.toLowerCase())) {
      return NextResponse.json(
        { error: 'This workspace URL is reserved. Please choose another.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if slug is already taken
    const existingWorkspace = await Workspace.findOne({ slug: workspaceUrl.toLowerCase() });
    if (existingWorkspace) {
      return NextResponse.json(
        { error: 'This workspace URL is already taken' },
        { status: 400 }
      );
    }

    // Check if user already completed onboarding
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create workspace
    const workspace = await Workspace.create({
      name: workspaceName.trim(),
      slug: workspaceUrl.toLowerCase(),
      ownerId: session.user.id,
      language,
      companySize,
      team,
    });

    // Add user as workspace owner
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: session.user.id,
      role: ROLES.OWNER,
      joinedAt: new Date(),
    });

    // Mark onboarding as complete
    user.onboardingCompleted = true;
    await user.save();

    return NextResponse.json({
      message: 'Onboarding completed successfully',
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error completing onboarding:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'This workspace URL is already taken' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/onboarding/check-slug
 * Check if a workspace slug is available
 */
export async function checkSlugAvailability(slug) {
  if (!slug || slug.length < 3) {
    return { available: false, error: 'URL must be at least 3 characters' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { available: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  }

  if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
    return { available: false, error: 'This URL is reserved' };
  }

  await dbConnect();
  const existing = await Workspace.findOne({ slug: slug.toLowerCase() });
  
  if (existing) {
    return { available: false, error: 'This URL is already taken' };
  }

  return { available: true };
}
