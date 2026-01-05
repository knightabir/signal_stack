import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import { createPortalSession } from '@/lib/stripe';
import { applyRateLimit } from '@/lib/rateLimit';
import { ACTIONS, hasPermission } from '@/lib/rbac';

/**
 * POST /api/billing/portal
 * Create Stripe customer portal session
 * PERMISSION: BILLING_UPDATE (Owner only)
 */
export async function POST(request) {
  try {
    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Find workspace
    let workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId });
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // RBAC: Check billing permission (Owner only)
    const member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (!member || !hasPermission(member.role, ACTIONS.BILLING_UPDATE)) {
      return NextResponse.json({ error: 'Permission denied: Only workspace owner can manage billing' }, { status: 403 });
    }

    if (!workspace.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
    }

    // Build return URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const returnUrl = `${protocol}://${host}/${workspace.slug}/settings/billing`;

    const portalSession = await createPortalSession(
      workspace.stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal:', error);
    return NextResponse.json({ error: 'Failed to create portal' }, { status: 500 });
  }
}
