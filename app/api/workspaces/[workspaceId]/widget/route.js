import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

/**
 * GET /api/workspaces/[workspaceId]/widget
 * Get widget settings
 */
export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId }).lean();
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check membership
    const member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.json({
      widget: {
        enabled: workspace.settings?.widgetEnabled || false,
        position: workspace.settings?.widgetPosition || 'bottom-right',
        theme: workspace.settings?.widgetTheme || 'auto',
        buttonText: workspace.settings?.widgetButtonText || 'Feedback',
        allowAnonymous: workspace.settings?.allowAnonymousFeedback ?? true,
        token: workspace.widgetToken || null,
      },
      embedCode: workspace.widgetToken
        ? `<script src="${baseUrl}/widget.js" data-token="${workspace.widgetToken}"></script>`
        : null,
    });
  } catch (error) {
    console.error('Error fetching widget settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]/widget
 * Update widget settings
 */
export async function PATCH(request, { params }) {
  try {
    const { workspaceId } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId });
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('settings:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, position, theme, buttonText, allowAnonymous } = body;

    if (!workspace.settings) {
      workspace.settings = {};
    }

    if (typeof enabled === 'boolean') {
      workspace.settings.widgetEnabled = enabled;
    }

    if (position && ['bottom-right', 'bottom-left'].includes(position)) {
      workspace.settings.widgetPosition = position;
    }

    if (theme && ['light', 'dark', 'auto'].includes(theme)) {
      workspace.settings.widgetTheme = theme;
    }

    if (buttonText !== undefined) {
      workspace.settings.widgetButtonText = buttonText.slice(0, 30);
    }

    if (typeof allowAnonymous === 'boolean') {
      workspace.settings.allowAnonymousFeedback = allowAnonymous;
    }

    await workspace.save();

    return NextResponse.json({
      message: 'Widget settings updated',
      settings: {
        enabled: workspace.settings.widgetEnabled,
        position: workspace.settings.widgetPosition,
        theme: workspace.settings.widgetTheme,
        buttonText: workspace.settings.widgetButtonText,
        allowAnonymous: workspace.settings.allowAnonymousFeedback,
      },
    });
  } catch (error) {
    console.error('Error updating widget settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/widget
 * Generate new widget token
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

    let workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId });
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check admin permission
    const member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (!member || !member.hasPermission('settings:update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Generate new token
    workspace.widgetToken = crypto.randomBytes(16).toString('hex');
    await workspace.save();

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.json({
      message: 'Token generated',
      token: workspace.widgetToken,
      embedCode: `<script src="${baseUrl}/widget.js" data-token="${workspace.widgetToken}"></script>`,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
