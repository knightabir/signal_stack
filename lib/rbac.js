/**
 * Centralized RBAC (Role-Based Access Control) System
 * 
 * This module provides:
 * - Role definitions
 * - Complete permission matrix
 * - Permission checking utilities
 * - Middleware helpers
 */

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
  PUBLIC: 'public', // For external/anonymous users
};

export const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.VIEWER]: 1,
  [ROLES.PUBLIC]: 0,
};

// ============================================
// ACTION DEFINITIONS
// ============================================

export const ACTIONS = {
  // Feedback actions
  FEEDBACK_READ: 'feedback:read',
  FEEDBACK_CREATE: 'feedback:create',
  FEEDBACK_UPDATE: 'feedback:update',
  FEEDBACK_DELETE: 'feedback:delete',
  FEEDBACK_MERGE: 'feedback:merge',
  FEEDBACK_MODERATE: 'feedback:moderate',
  FEEDBACK_VOTE: 'feedback:vote',
  FEEDBACK_COMMENT: 'feedback:comment',

  // Roadmap actions
  ROADMAP_READ: 'roadmap:read',
  ROADMAP_CREATE: 'roadmap:create',
  ROADMAP_UPDATE: 'roadmap:update',
  ROADMAP_DELETE: 'roadmap:delete',
  ROADMAP_REORDER: 'roadmap:reorder',
  ROADMAP_PROMOTE: 'roadmap:promote',

  // Changelog actions
  CHANGELOG_READ: 'changelog:read',
  CHANGELOG_CREATE: 'changelog:create',
  CHANGELOG_UPDATE: 'changelog:update',
  CHANGELOG_DELETE: 'changelog:delete',
  CHANGELOG_PUBLISH: 'changelog:publish',

  // Analytics actions
  ANALYTICS_READ: 'analytics:read',

  // Widget actions
  WIDGET_READ: 'widget:read',
  WIDGET_UPDATE: 'widget:update',

  // Workspace actions
  WORKSPACE_READ: 'workspace:read',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',

  // Member actions
  MEMBERS_READ: 'members:read',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_REMOVE: 'members:remove',
  MEMBERS_MANAGE: 'members:manage',

  // Billing actions
  BILLING_READ: 'billing:read',
  BILLING_UPDATE: 'billing:update',

  // Settings actions
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Integration actions
  INTEGRATIONS_READ: 'integrations:read',
  INTEGRATIONS_UPDATE: 'integrations:update',
};

// ============================================
// PERMISSION MATRIX
// ============================================

export const PERMISSIONS = {
  // Feedback permissions
  [ACTIONS.FEEDBACK_READ]: [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER, ROLES.PUBLIC],
  [ACTIONS.FEEDBACK_CREATE]: [ROLES.OWNER, ROLES.ADMIN, ROLES.PUBLIC], // Viewers cannot create
  [ACTIONS.FEEDBACK_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.FEEDBACK_DELETE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.FEEDBACK_MERGE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.FEEDBACK_MODERATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.FEEDBACK_VOTE]: [ROLES.OWNER, ROLES.ADMIN, ROLES.PUBLIC], // Viewers cannot vote
  [ACTIONS.FEEDBACK_COMMENT]: [ROLES.OWNER, ROLES.ADMIN, ROLES.PUBLIC], // Viewers cannot comment

  // Roadmap permissions
  [ACTIONS.ROADMAP_READ]: [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER, ROLES.PUBLIC],
  [ACTIONS.ROADMAP_CREATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.ROADMAP_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.ROADMAP_DELETE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.ROADMAP_REORDER]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.ROADMAP_PROMOTE]: [ROLES.OWNER, ROLES.ADMIN],

  // Changelog permissions
  [ACTIONS.CHANGELOG_READ]: [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER, ROLES.PUBLIC],
  [ACTIONS.CHANGELOG_CREATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.CHANGELOG_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.CHANGELOG_DELETE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.CHANGELOG_PUBLISH]: [ROLES.OWNER, ROLES.ADMIN],

  // Analytics permissions
  [ACTIONS.ANALYTICS_READ]: [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER], // Viewer can view (read-only)

  // Widget permissions
  [ACTIONS.WIDGET_READ]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.WIDGET_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],

  // Workspace permissions
  [ACTIONS.WORKSPACE_READ]: [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER],
  [ACTIONS.WORKSPACE_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.WORKSPACE_DELETE]: [ROLES.OWNER], // Only owner

  // Member permissions
  [ACTIONS.MEMBERS_READ]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.MEMBERS_INVITE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.MEMBERS_REMOVE]: [ROLES.OWNER], // Only owner can remove
  [ACTIONS.MEMBERS_MANAGE]: [ROLES.OWNER], // Only owner can change roles

  // Billing permissions - OWNER ONLY
  [ACTIONS.BILLING_READ]: [ROLES.OWNER],
  [ACTIONS.BILLING_UPDATE]: [ROLES.OWNER],

  // Settings permissions
  [ACTIONS.SETTINGS_READ]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.SETTINGS_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],

  // Integration permissions
  [ACTIONS.INTEGRATIONS_READ]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.INTEGRATIONS_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],
};

// ============================================
// PERMISSION CHECKING UTILITIES
// ============================================

/**
 * Check if a role has permission to perform an action
 */
export function hasPermission(role, action) {
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) {
    console.warn(`Unknown action: ${action}`);
    return false;
  }
  return allowedRoles.includes(role);
}

/**
 * Check if role can perform multiple actions (all required)
 */
export function hasAllPermissions(role, actions) {
  return actions.every((action) => hasPermission(role, action));
}

/**
 * Check if role can perform at least one action
 */
export function hasAnyPermission(role, actions) {
  return actions.some((action) => hasPermission(role, action));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role) {
  return Object.keys(PERMISSIONS).filter((action) => 
    PERMISSIONS[action].includes(role)
  );
}

/**
 * Compare role hierarchy (returns true if role1 >= role2)
 */
export function isRoleGreaterOrEqual(role1, role2) {
  return (ROLE_HIERARCHY[role1] || 0) >= (ROLE_HIERARCHY[role2] || 0);
}

// ============================================
// RBAC RESULT HELPERS
// ============================================

/**
 * Standard permission denied response
 */
export function permissionDenied(action) {
  return {
    error: `Permission denied: ${action}`,
    code: 'PERMISSION_DENIED',
  };
}

/**
 * Check permission and throw if denied (for use in API routes)
 */
export function requirePermission(role, action) {
  if (!hasPermission(role, action)) {
    throw new PermissionError(action);
  }
}

export class PermissionError extends Error {
  constructor(action) {
    super(`Permission denied: ${action}`);
    this.name = 'PermissionError';
    this.action = action;
    this.statusCode = 403;
  }
}

// ============================================
// AUDIT LOGGING
// ============================================

const DESTRUCTIVE_ACTIONS = [
  ACTIONS.FEEDBACK_DELETE,
  ACTIONS.ROADMAP_DELETE,
  ACTIONS.CHANGELOG_DELETE,
  ACTIONS.WORKSPACE_DELETE,
  ACTIONS.MEMBERS_REMOVE,
];

/**
 * Check if action should be audited
 */
export function shouldAuditAction(action) {
  return DESTRUCTIVE_ACTIONS.includes(action);
}

/**
 * Log administrative action (placeholder - implement with your logging service)
 */
export function logAdminAction(userId, workspaceId, action, details = {}) {
  const isDestructive = shouldAuditAction(action);
  const logLevel = isDestructive ? 'warn' : 'info';
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    workspaceId,
    action,
    isDestructive,
    details,
  };

  // Log to console (replace with proper logging in production)
  console[logLevel]('[RBAC AUDIT]', JSON.stringify(logEntry));
  
  // TODO: Store in database or send to logging service
  return logEntry;
}
