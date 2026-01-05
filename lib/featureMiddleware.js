import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import { hasFeatureAccess, checkFeatureAccess, checkPlanLimit, FEATURES } from '@/lib/featureGating';

/**
 * Feature Gating Middleware
 * 
 * Enforces plan-based feature access at the API level.
 * Returns 403 with UPGRADE_REQUIRED for restricted features.
 */

/**
 * Require feature access - returns 403 if not available
 */
export async function requireFeature(request, workspaceId, featureId) {
  await dbConnect();

  // Get workspace
  let workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    workspace = await Workspace.findOne({ slug: workspaceId });
  }

  if (!workspace) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      ),
    };
  }

  const currentPlan = workspace.plan || 'free';
  const access = checkFeatureAccess(currentPlan, featureId);

  if (!access.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: access.message,
          code: 'UPGRADE_REQUIRED',
          requiredPlan: access.requiredPlan,
          currentPlan,
          feature: featureId,
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, workspace, plan: currentPlan };
}

/**
 * Check plan limit - returns 403 if limit exceeded
 */
export async function requirePlanLimit(workspaceId, limitType, currentCount) {
  await dbConnect();

  let workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    workspace = await Workspace.findOne({ slug: workspaceId });
  }

  if (!workspace) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      ),
    };
  }

  const currentPlan = workspace.plan || 'free';
  const limitCheck = checkPlanLimit(currentPlan, limitType, currentCount);

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: `You've reached the ${limitType} limit for your plan`,
          code: 'UPGRADE_REQUIRED',
          currentPlan,
          limit: limitCheck.limit,
          current: limitCheck.current,
          limitType,
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, workspace, plan: currentPlan, ...limitCheck };
}

/**
 * Get workspace with feature access map
 */
export async function getWorkspaceWithFeatures(workspaceId) {
  await dbConnect();

  let workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    workspace = await Workspace.findOne({ slug: workspaceId });
  }

  if (!workspace) {
    return null;
  }

  const currentPlan = workspace.plan || 'free';

  // Build feature access map
  const features = {};
  Object.values(FEATURES).forEach(feature => {
    const hasAccess = hasFeatureAccess(currentPlan, feature.id);
    features[feature.id] = {
      hasAccess,
      isLocked: !hasAccess,
      requiredPlan: feature.minPlan,
    };
  });

  return {
    workspace: workspace.toObject(),
    plan: currentPlan,
    features,
  };
}

/**
 * Middleware wrapper for feature-gated routes
 */
export function withFeatureGate(featureId, handler) {
  return async (request, context) => {
    const workspaceId = context?.params?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      );
    }

    const access = await requireFeature(request, workspaceId, featureId);

    if (!access.allowed) {
      return access.response;
    }

    // Add workspace and plan to context
    return handler(request, {
      ...context,
      workspace: access.workspace,
      plan: access.plan,
    });
  };
}
