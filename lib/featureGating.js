/**
 * Feature Gating System
 * 
 * Defines which features are available on each plan and provides
 * utilities for checking access and generating upgrade prompts.
 */

// ============================================
// PLAN HIERARCHY
// ============================================

export const PLAN_LEVELS = {
  free: 0,
  pro: 1,
  business: 2,
};

// ============================================
// FEATURE DEFINITIONS
// ============================================

export const FEATURES = {
  // Free plan features
  FEEDBACK_BOARD: {
    id: 'feedback_board',
    name: 'Feedback Board',
    description: 'Public feedback collection board',
    minPlan: 'free',
  },
  BASIC_ANALYTICS: {
    id: 'basic_analytics',
    name: 'Basic Analytics',
    description: 'View feedback counts and status',
    minPlan: 'free',
  },
  ROADMAP_VIEW: {
    id: 'roadmap_view',
    name: 'Roadmap View',
    description: 'Public product roadmap',
    minPlan: 'free',
  },
  CHANGELOG: {
    id: 'changelog',
    name: 'Changelog',
    description: 'Public changelog and announcements',
    minPlan: 'free',
  },

  // Pro plan features (Premium)
  WIDGET: {
    id: 'widget',
    name: 'Embeddable Widget',
    description: 'Embed feedback widget on your product',
    minPlan: 'pro',
  },
  API_ACCESS: {
    id: 'api_access',
    name: 'API Access',
    description: 'Programmatic access via REST API',
    minPlan: 'pro',
  },
  UNLIMITED_FEEDBACK: {
    id: 'unlimited_feedback',
    name: 'Unlimited Feedback',
    description: 'No limit on feedback items',
    minPlan: 'pro',
  },
  INTEGRATIONS: {
    id: 'integrations',
    name: 'Integrations',
    description: 'Slack, webhooks, and GitHub',
    minPlan: 'pro',
  },
  ADVANCED_ANALYTICS: {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed insights and trends',
    minPlan: 'pro',
  },

  // Business plan features
  REMOVE_BRANDING: {
    id: 'remove_branding',
    name: 'Remove Branding',
    description: 'Remove Signalstack branding',
    minPlan: 'business',
  },
  CUSTOM_DOMAIN: {
    id: 'custom_domain',
    name: 'Custom Domain',
    description: 'Use your own domain',
    minPlan: 'business',
  },
  PRIORITY_SUPPORT: {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Dedicated support channel',
    minPlan: 'business',
  },
  SSO: {
    id: 'sso',
    name: 'Single Sign-On',
    description: 'Enterprise SSO integration',
    minPlan: 'business',
  },
  AUDIT_LOGS: {
    id: 'audit_logs',
    name: 'Audit Logs',
    description: 'Detailed activity tracking',
    minPlan: 'business',
  },
};

// ============================================
// ACCESS CHECK UTILITIES
// ============================================

/**
 * Check if subscription is active (not expired/canceled)
 * @param {Object} workspace - Workspace object with subscriptionStatus and planExpiresAt
 * @returns {boolean}
 */
export function isSubscriptionActive(workspace) {
  if (!workspace) return false;
  
  // Free plan is always "active"
  if (workspace.plan === 'free' || !workspace.plan) {
    return true;
  }

  // Check subscription status
  const status = workspace.subscriptionStatus;
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    return false;
  }

  // Check expiration date
  if (workspace.planExpiresAt) {
    const expiresAt = new Date(workspace.planExpiresAt);
    if (expiresAt < new Date()) {
      return false; // Expired
    }
  }

  // Active statuses: active, trialing, past_due (still has grace period)
  return true;
}

/**
 * Get effective plan (returns 'free' if subscription inactive)
 */
export function getEffectivePlan(workspace) {
  if (!workspace) return 'free';
  
  // If subscription is not active, treat as free
  if (!isSubscriptionActive(workspace)) {
    return 'free';
  }
  
  return workspace.plan || 'free';
}

/**
 * Check if a plan has access to a feature
 */
export function hasFeatureAccess(currentPlan, featureId) {
  const feature = Object.values(FEATURES).find(f => f.id === featureId);
  if (!feature) return true; // Unknown features default to accessible

  const currentLevel = PLAN_LEVELS[currentPlan] ?? 0;
  const requiredLevel = PLAN_LEVELS[feature.minPlan] ?? 0;

  return currentLevel >= requiredLevel;
}

/**
 * Check if workspace has access to feature (including subscription status)
 */
export function hasWorkspaceFeatureAccess(workspace, featureId) {
  const effectivePlan = getEffectivePlan(workspace);
  return hasFeatureAccess(effectivePlan, featureId);
}

/**
 * Get the upgrade badge text for a locked feature
 */
export function getUpgradeBadge(currentPlan, featureId) {
  const feature = Object.values(FEATURES).find(f => f.id === featureId);
  if (!feature) return null;

  const currentLevel = PLAN_LEVELS[currentPlan] ?? 0;
  const requiredLevel = PLAN_LEVELS[feature.minPlan] ?? 0;

  if (currentLevel >= requiredLevel) return null; // Has access

  // Determine upgrade text based on required plan
  if (feature.minPlan === 'pro') {
    return { text: 'Premium', plan: 'pro' };
  } else if (feature.minPlan === 'business') {
    return { text: 'Upgrade to Business', plan: 'business' };
  }

  return null;
}

/**
 * Get the required plan for a feature
 */
export function getRequiredPlan(featureId) {
  const feature = Object.values(FEATURES).find(f => f.id === featureId);
  return feature?.minPlan || 'free';
}

/**
 * Get all features with their access status for a plan
 */
export function getFeatureAccessMap(currentPlan) {
  const map = {};
  
  Object.values(FEATURES).forEach(feature => {
    const hasAccess = hasFeatureAccess(currentPlan, feature.id);
    const upgrade = getUpgradeBadge(currentPlan, feature.id);
    
    map[feature.id] = {
      ...feature,
      hasAccess,
      isLocked: !hasAccess,
      upgradeBadge: upgrade,
    };
  });

  return map;
}

/**
 * API-level check - returns upgrade required response if feature is locked
 */
export function checkFeatureAccess(currentPlan, featureId) {
  if (hasFeatureAccess(currentPlan, featureId)) {
    return { allowed: true };
  }

  const feature = Object.values(FEATURES).find(f => f.id === featureId);
  const requiredPlan = feature?.minPlan || 'pro';
  
  return {
    allowed: false,
    reason: 'UPGRADE_REQUIRED',
    requiredPlan,
    message: `This feature requires the ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan`,
  };
}

// ============================================
// PLAN LIMIT CHECKS
// ============================================

export const PLAN_LIMITS = {
  free: {
    maxFeedback: 50,
    maxMembers: 3,
    maxWidgets: 0,
    maxIntegrations: 0,
  },
  pro: {
    maxFeedback: Infinity,
    maxMembers: 10,
    maxWidgets: 5,
    maxIntegrations: 3,
  },
  business: {
    maxFeedback: Infinity,
    maxMembers: Infinity,
    maxWidgets: Infinity,
    maxIntegrations: Infinity,
  },
};

/**
 * Check if within plan limits
 */
export function checkPlanLimit(currentPlan, limitType, currentCount) {
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;
  const limit = limits[limitType];
  
  if (limit === undefined) return { allowed: true };
  
  const allowed = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount);
  
  return {
    allowed,
    limit,
    current: currentCount,
    remaining,
    isUnlimited: limit === Infinity,
  };
}
