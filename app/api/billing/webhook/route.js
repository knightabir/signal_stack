import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workspace, Subscription } from '@/models';
import { constructWebhookEvent } from '@/lib/stripe';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Map price ID to plan name
 */
function getPlanFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 
      priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
    return 'pro';
  }
  if (priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || 
      priceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID) {
    return 'business';
  }
  return 'pro'; // Default to pro if price ID doesn't match (for safety)
}

/**
 * Calculate MRR from amount and interval
 */
function calculateMRR(amount, interval) {
  if (interval === 'yearly' || interval === 'year') {
    return Math.round(amount / 12);
  }
  return amount;
}

/**
 * POST /api/billing/webhook
 * Handle Stripe webhook events
 */
export async function POST(request) {
  console.log('[WEBHOOK] Received webhook request');
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[WEBHOOK] Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = constructWebhookEvent(body, signature);
      console.log('[WEBHOOK] Event type:', event.type);
    } catch (err) {
      console.error('[WEBHOOK] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        
        console.log('[WEBHOOK] Checkout completed for workspace:', workspaceId);
        console.log('[WEBHOOK] Customer:', session.customer, 'Subscription:', session.subscription);
        
        if (workspaceId) {
          // Update workspace with Stripe customer and subscription ID
          const updatedWorkspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'active',
            },
            { new: true }
          );
          console.log('[WEBHOOK] Updated workspace:', updatedWorkspace?.name);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        let workspaceId = subscription.metadata?.workspaceId;

        console.log('[WEBHOOK] Subscription event:', event.type);
        console.log('[WEBHOOK] Subscription ID:', subscription.id);
        console.log('[WEBHOOK] Customer ID:', subscription.customer);
        console.log('[WEBHOOK] WorkspaceId from metadata:', workspaceId);

        // If no workspaceId in metadata, try to find by subscription ID first, then customer ID
        if (!workspaceId) {
          let workspace = await Workspace.findOne({ 
            stripeSubscriptionId: subscription.id 
          });
          
          if (!workspace) {
            workspace = await Workspace.findOne({ 
              stripeCustomerId: subscription.customer 
            });
          }
          
          if (workspace) {
            workspaceId = workspace._id.toString();
            console.log('[WEBHOOK] Found workspace by lookup:', workspaceId);
          }
        }

        if (!workspaceId) {
          console.log('[WEBHOOK] No workspaceId found, skipping subscription update');
          // Return 200 to acknowledge - we'll update when checkout.session.completed fires
          return NextResponse.json({ received: true, note: 'No workspaceId, will update later' }, { status: 200 });
        }

        // Get price and interval info
        const priceId = subscription.items?.data[0]?.price?.id;
        const productId = subscription.items?.data[0]?.price?.product;
        const interval = subscription.items?.data[0]?.price?.recurring?.interval;
        const amount = subscription.items?.data[0]?.price?.unit_amount || 1900; // Default to $19 if missing
        
        const billingInterval = interval === 'year' ? 'yearly' : 'monthly';
        const plan = getPlanFromPriceId(priceId);
        
        // Calculate MRR (monthly recurring revenue)
        const mrr = calculateMRR(amount, interval);

        console.log('[WEBHOOK] Plan:', plan, 'Interval:', billingInterval, 'Amount:', amount, 'MRR:', mrr);

        // Calculate expiration date safely
        const planExpiresAt = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : null;

        // Update workspace - only include planExpiresAt if valid
        const updateData = {
          plan,
          billingInterval,
          subscriptionStatus: subscription.status,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
        };
        
        if (planExpiresAt) {
          updateData.planExpiresAt = planExpiresAt;
        }

        await Workspace.findByIdAndUpdate(
          workspaceId,
          updateData,
          { new: true }
        );

        console.log('[WEBHOOK] Updated workspace plan to:', plan);

        // Create or update subscription record for analytics
        try {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer,
              stripePriceId: priceId || 'unknown',
              stripeProductId: productId || 'unknown',
              workspaceId,
              plan,
              billingInterval,
              status: subscription.status,
              startDate: subscription.start_date ? new Date(subscription.start_date * 1000) : new Date(),
              currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
              endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
              amount,
              currency: subscription.currency || 'usd',
              mrr,
            },
            { upsert: true, new: true }
          );
          console.log('[WEBHOOK] Subscription record saved successfully');
        } catch (subError) {
          console.error('[WEBHOOK] Error saving subscription record:', subError.message);
          // Don't fail the webhook for analytics errors
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        console.log('[WEBHOOK] Subscription deleted:', subscription.id);

        // Find workspace by subscription ID
        const workspace = await Workspace.findOne({ 
          stripeSubscriptionId: subscription.id 
        });

        if (workspace) {
          // Downgrade workspace to free
          await Workspace.findByIdAndUpdate(workspace._id, {
            plan: 'free',
            billingInterval: null,
            subscriptionStatus: 'canceled',
          });

          // Update subscription record
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              status: 'canceled',
              canceledAt: new Date(),
              endedAt: new Date(),
              mrr: 0,
            }
          );

          console.log('[WEBHOOK] Workspace downgraded to free');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log('[WEBHOOK] Payment succeeded for subscription:', subscriptionId);

        if (subscriptionId) {
          await Workspace.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { subscriptionStatus: 'active' }
          );

          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { status: 'active' }
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        console.log('[WEBHOOK] Payment failed for subscription:', subscriptionId);

        if (subscriptionId) {
          await Workspace.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { subscriptionStatus: 'past_due' }
          );

          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { status: 'past_due' }
          );
        }
        break;
      }

      default:
        // Don't log unhandled events to reduce noise
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error.message);
    console.error('[WEBHOOK] Stack:', error.stack);
    return NextResponse.json({ error: 'Webhook handler failed', details: error.message }, { status: 500 });
  }
}
