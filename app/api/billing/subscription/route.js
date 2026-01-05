import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import stripe from '@/lib/stripe';

/**
 * GET /api/billing/subscription
 * Get detailed subscription information including payment methods and invoices
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find workspace
    let workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId });
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

    // Build response
    const response = {
      plan: workspace.plan || 'free',
      billingInterval: workspace.billingInterval,
      subscriptionStatus: workspace.subscriptionStatus,
      planExpiresAt: workspace.planExpiresAt,
      stripeCustomerId: workspace.stripeCustomerId,
      stripeSubscriptionId: workspace.stripeSubscriptionId,
      subscription: null,
      paymentMethod: null,
      invoices: [],
      daysRemaining: null,
    };

    // If no Stripe customer, return basic info
    if (!workspace.stripeCustomerId) {
      return NextResponse.json(response);
    }

    try {
      // Get subscription details from Stripe
      if (workspace.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId, {
          expand: ['default_payment_method', 'latest_invoice'],
        });

        response.subscription = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        };

        // Calculate days remaining
        const now = new Date();
        const periodEnd = new Date(subscription.current_period_end * 1000);
        const diffTime = periodEnd - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        response.daysRemaining = Math.max(0, diffDays);

        // Get payment method
        if (subscription.default_payment_method) {
          const pm = subscription.default_payment_method;
          if (pm.card) {
            response.paymentMethod = {
              type: 'card',
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            };
          }
        }
      }

      // Get invoices
      const invoices = await stripe.invoices.list({
        customer: workspace.stripeCustomerId,
        limit: 10,
      });

      response.invoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      }));
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError.message);
      // Return partial data if Stripe fails
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
