import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import { createCheckoutSession } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';
import { applyRateLimit } from '@/lib/rateLimit';
import { ACTIONS, hasPermission, logAdminAction } from '@/lib/rbac';

/**
 * POST /api/billing/checkout
 * Create Stripe checkout session
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
    const { workspaceId, plan, interval = 'monthly' } = body;

    if (!workspaceId || !plan) {
      return NextResponse.json({ error: 'workspaceId and plan are required' }, { status: 400 });
    }

    if (!['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
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

    // Audit log
    logAdminAction(session.user.id, workspace._id.toString(), ACTIONS.BILLING_UPDATE, { plan, interval });

    // Get price ID
    const planConfig = PLANS[plan];
    const priceId = planConfig?.stripePriceIds?.[interval];

    if (!priceId) {
      return NextResponse.json({ 
        error: 'Stripe price not configured. Please set STRIPE_*_PRICE_ID environment variables.' 
      }, { status: 500 });
    }

    // Build URLs
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const checkoutSession = await createCheckoutSession({
      workspaceId: workspace._id.toString(),
      workspaceName: workspace.name,
      customerId: workspace.stripeCustomerId,
      customerEmail: session.user.email, // Pre-fill email for new customers
      priceId,
      successUrl: `${baseUrl}/${workspace.slug}/settings/billing?success=true`,
      cancelUrl: `${baseUrl}/${workspace.slug}/settings/billing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
