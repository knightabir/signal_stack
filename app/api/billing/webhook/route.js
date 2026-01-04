import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workspace } from '@/models';
import { constructWebhookEvent } from '@/lib/stripe';

/**
 * POST /api/billing/webhook
 * Handle Stripe webhook events
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        
        if (workspaceId) {
          await Workspace.findByIdAndUpdate(workspaceId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const workspaceId = subscription.metadata?.workspaceId;

        if (workspaceId) {
          // Determine plan from price
          let plan = 'free';
          let billingInterval = null;
          const priceId = subscription.items?.data[0]?.price?.id;
          const interval = subscription.items?.data[0]?.price?.recurring?.interval;
          
          billingInterval = interval === 'year' ? 'yearly' : 'monthly';

          // Map price ID to plan (check env vars)
          if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 
              priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
            plan = 'pro';
          } else if (priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 
                     priceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID) {
            plan = 'business';
          }

          await Workspace.findByIdAndUpdate(workspaceId, {
            plan,
            billingInterval,
            subscriptionStatus: subscription.status,
            planExpiresAt: new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const workspaceId = subscription.metadata?.workspaceId;

        if (workspaceId) {
          await Workspace.findByIdAndUpdate(workspaceId, {
            plan: 'free',
            billingInterval: null,
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          await Workspace.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { subscriptionStatus: 'past_due' }
          );
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          await Workspace.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { subscriptionStatus: 'active' }
          );
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};
