import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import { ROLES, hasPermission, logAdminAction, shouldAuditAction } from '@/lib/rbac';

/**
 * API Route Protection Utility
 * 
 * Provides standardized authentication and authorization for API routes.
 * Enforces RBAC at API level - never trust frontend checks.
 */

/**
 * Protect an API route with authentication and optional permission check
 * 
 * @param {Request} request - The incoming request
 * @param {Object} options - Protection options
 * @param {string} options.workspaceId - Workspace ID or slug (required for permission check)
 * @param {string} options.requiredPermission - Permission required to access the route
 * @param {boolean} options.allowPublic - Allow public/anonymous access (for public endpoints)
 * @returns {Object} { user, workspace, member, role } or throws error
 */
export async function protectRoute(request, options = {}) {
  const { workspaceId, requiredPermission, allowPublic = false } = options;

  await dbConnect();

  // Get session
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.id;

  // If not authenticated and not allowing public access
  if (!isAuthenticated && !allowPublic) {
    throw new AuthError('Authentication required', 401);
  }

  // If no workspace context needed, return early
  if (!workspaceId) {
    return {
      user: session?.user || null,
      workspace: null,
      member: null,
      role: isAuthenticated ? null : ROLES.PUBLIC,
    };
  }

  // Find workspace
  let workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) {
    workspace = await Workspace.findOne({ slug: workspaceId }).lean();
  }

  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }

  // Get member role (if authenticated)
  let member = null;
  let role = ROLES.PUBLIC;

  if (isAuthenticated) {
    member = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: session.user.id,
    });

    if (member) {
      role = member.role;
    } else if (!allowPublic) {
      // User is authenticated but not a member
      throw new AuthError('Not a workspace member', 403);
    }
  }

  // Check permission if required
  if (requiredPermission) {
    if (!hasPermission(role, requiredPermission)) {
      throw new AuthError(`Permission denied: ${requiredPermission}`, 403);
    }
  }

  return {
    user: session?.user || null,
    workspace,
    member,
    role,
  };
}

/**
 * Wrapper for API route handlers with built-in protection
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    try {
      const { workspaceId: workspaceIdFn, ...restOptions } = options;
      
      // Get workspaceId from params if it's a function
      let workspaceId = workspaceIdFn;
      if (typeof workspaceIdFn === 'function') {
        workspaceId = await workspaceIdFn(context);
      }

      const auth = await protectRoute(request, { ...restOptions, workspaceId });
      
      // Call the handler with auth context
      return handler(request, { ...context, auth });
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

/**
 * Log admin action for audit trail
 */
export function auditAction(userId, workspaceId, action, details = {}) {
  if (shouldAuditAction(action)) {
    logAdminAction(userId, workspaceId, action, details);
  }
}

// ============================================
// ERROR CLASSES
// ============================================

export class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// ============================================
// ERROR HANDLER
// ============================================

export function handleAuthError(error) {
  console.error('API Error:', error.message);

  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, code: 'AUTH_ERROR' },
      { status: error.statusCode }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Unknown error
  return NextResponse.json(
    { error: 'Internal server error', code: 'SERVER_ERROR' },
    { status: 500 }
  );
}

// ============================================
// CONVENIENCE CHECKS
// ============================================

/**
 * Quick check if user is owner
 */
export function isOwner(member) {
  return member?.role === ROLES.OWNER;
}

/**
 * Quick check if user is admin or owner
 */
export function isAdminOrOwner(member) {
  return member?.role === ROLES.OWNER || member?.role === ROLES.ADMIN;
}

/**
 * Quick check if user is viewer
 */
export function isViewer(member) {
  return member?.role === ROLES.VIEWER;
}
