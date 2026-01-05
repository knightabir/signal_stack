import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default stripe;

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession({
  workspaceId,
  workspaceName,
  customerId,
  customerEmail,
  priceId,
  successUrl,
  cancelUrl,
}) {
  const sessionParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      workspaceId,
    },
    subscription_data: {
      metadata: {
        workspaceId,
      },
    },
  };

  // If customer exists, use them; otherwise Stripe will create one from the email collected
  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    // Pre-fill email for new customers
    sessionParams.customer_email = customerEmail;
  }
  // For subscription mode, Stripe automatically creates a customer if one doesn't exist

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(customerId, returnUrl) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId) {
  if (!subscriptionId) return null;
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(body, signature) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
