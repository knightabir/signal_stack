import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

/**
 * GET /api/workspaces/[workspaceId]/integrations
 * Get integration settings
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

    const integrations = workspace.integrations || {};

    return NextResponse.json({
      slack: {
        webhookUrl: integrations.slackWebhookUrl ? '••••••••' + integrations.slackWebhookUrl.slice(-8) : null,
        isConfigured: !!integrations.slackWebhookUrl,
        events: integrations.slackEvents || ['feedback.created', 'roadmap.shipped'],
      },
      webhook: {
        url: integrations.webhookUrl || null,
        hasSecret: !!integrations.webhookSecret,
        events: integrations.webhookEvents || ['feedback.created', 'feedback.voted', 'roadmap.shipped'],
      },
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

/**
 * PATCH /api/workspaces/[workspaceId]/integrations
 * Update integration settings
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
    const { slackWebhookUrl, slackEvents, webhookUrl, webhookEvents, regenerateSecret } = body;

    if (!workspace.integrations) {
      workspace.integrations = {};
    }

    // Update Slack settings
    if (slackWebhookUrl !== undefined) {
      workspace.integrations.slackWebhookUrl = slackWebhookUrl || null;
    }

    if (slackEvents) {
      workspace.integrations.slackEvents = slackEvents;
    }

    // Update webhook settings
    if (webhookUrl !== undefined) {
      workspace.integrations.webhookUrl = webhookUrl || null;
    }

    if (webhookEvents) {
      workspace.integrations.webhookEvents = webhookEvents;
    }

    // Regenerate webhook secret
    if (regenerateSecret) {
      workspace.integrations.webhookSecret = crypto.randomBytes(32).toString('hex');
    }

    await workspace.save();

    return NextResponse.json({
      message: 'Integrations updated',
      slack: {
        isConfigured: !!workspace.integrations.slackWebhookUrl,
        events: workspace.integrations.slackEvents,
      },
      webhook: {
        url: workspace.integrations.webhookUrl,
        hasSecret: !!workspace.integrations.webhookSecret,
        secret: regenerateSecret ? workspace.integrations.webhookSecret : undefined,
        events: workspace.integrations.webhookEvents,
      },
    });
  } catch (error) {
    console.error('Error updating integrations:', error);
    return NextResponse.json({ error: 'Failed to update integrations' }, { status: 500 });
  }
}
