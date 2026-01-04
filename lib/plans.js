/**
 * Plan definitions and limits for Signalstack
 */

export const PLANS = {
  free: {
    name: 'Free',
    description: 'Get started with basic feedback collection',
    features: [
      'Up to 50 feedback items',
      'Public feedback board',
      'Basic analytics',
    ],
    limits: {
      maxFeedback: 50,
      widgetEnabled: false,
      removeBranding: false,
      apiAccess: false,
    },
    pricing: {
      monthly: 0,
      yearly: 0,
    },
  },
  pro: {
    name: 'Pro',
    description: 'For growing teams and products',
    features: [
      'Unlimited feedback',
      'Embeddable widget',
      'API access',
      'Priority support',
    ],
    limits: {
      maxFeedback: Infinity,
      widgetEnabled: true,
      removeBranding: false,
      apiAccess: true,
    },
    pricing: {
      monthly: 1900, // $19.00 in cents
      yearly: 19000, // $190.00 in cents (2 months free)
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
  },
  business: {
    name: 'Business',
    description: 'For larger organizations',
    features: [
      'Everything in Pro',
      'Remove Signalstack branding',
      'Custom domain support',
      'Dedicated support',
    ],
    limits: {
      maxFeedback: Infinity,
      widgetEnabled: true,
      removeBranding: true,
      apiAccess: true,
    },
    pricing: {
      monthly: 4900, // $49.00 in cents
      yearly: 49000, // $490.00 in cents (2 months free)
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    },
  },
};

export const PLAN_ORDER = ['free', 'pro', 'business'];

/**
 * Get plan details by name
 */
export function getPlan(planName) {
  return PLANS[planName] || PLANS.free;
}

/**
 * Check if workspace can perform action based on plan
 */
export function canPerformAction(plan, action, currentCount = 0) {
  const planConfig = getPlan(plan);
  
  switch (action) {
    case 'create_feedback':
      return currentCount < planConfig.limits.maxFeedback;
    case 'use_widget':
      return planConfig.limits.widgetEnabled;
    case 'remove_branding':
      return planConfig.limits.removeBranding;
    case 'api_access':
      return planConfig.limits.apiAccess;
    default:
      return true;
  }
}

/**
 * Get feedback limit for plan
 */
export function getFeedbackLimit(plan) {
  return getPlan(plan).limits.maxFeedback;
}

/**
 * Format price for display
 */
export function formatPrice(cents, interval = 'monthly') {
  const dollars = cents / 100;
  if (dollars === 0) return 'Free';
  return `$${dollars}/${interval === 'yearly' ? 'year' : 'mo'}`;
}
