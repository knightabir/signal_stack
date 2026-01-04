import mongoose from 'mongoose';

// Role hierarchy: Owner > Admin > Viewer
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
};

// Permissions matrix
export const PERMISSIONS = {
  // Feedback permissions
  'feedback:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER],
  'feedback:create': [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER],
  'feedback:update': [ROLES.OWNER, ROLES.ADMIN],
  'feedback:delete': [ROLES.OWNER, ROLES.ADMIN],
  'feedback:moderate': [ROLES.OWNER, ROLES.ADMIN],
  
  // Roadmap permissions
  'roadmap:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER],
  'roadmap:update': [ROLES.OWNER, ROLES.ADMIN],
  
  // Changelog permissions
  'changelog:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER],
  'changelog:create': [ROLES.OWNER, ROLES.ADMIN],
  'changelog:update': [ROLES.OWNER, ROLES.ADMIN],
  'changelog:delete': [ROLES.OWNER, ROLES.ADMIN],
  
  // Workspace permissions
  'workspace:read': [ROLES.OWNER, ROLES.ADMIN, ROLES.VIEWER],
  'workspace:update': [ROLES.OWNER, ROLES.ADMIN],
  'workspace:delete': [ROLES.OWNER],
  
  // Member permissions
  'members:read': [ROLES.OWNER, ROLES.ADMIN],
  'members:invite': [ROLES.OWNER, ROLES.ADMIN],
  'members:remove': [ROLES.OWNER],
  'members:update_role': [ROLES.OWNER],
  
  // Billing permissions
  'billing:read': [ROLES.OWNER],
  'billing:update': [ROLES.OWNER],
  
  // Settings permissions
  'settings:read': [ROLES.OWNER, ROLES.ADMIN],
  'settings:update': [ROLES.OWNER, ROLES.ADMIN],
};

const WorkspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.VIEWER,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    invitedAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only be a member once per workspace
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

// Check if user has permission
WorkspaceMemberSchema.methods.hasPermission = function (permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(this.role);
};

// Get all permissions for this member
WorkspaceMemberSchema.methods.getPermissions = function () {
  return Object.keys(PERMISSIONS).filter((permission) =>
    PERMISSIONS[permission].includes(this.role)
  );
};

// Static method to get member with permissions
WorkspaceMemberSchema.statics.findMemberWithPermissions = async function (
  workspaceId,
  userId
) {
  const member = await this.findOne({ workspaceId, userId })
    .populate('userId', 'name email image')
    .populate('workspaceId', 'name slug');
  
  if (!member) {
    return null;
  }

  return {
    ...member.toObject(),
    permissions: member.getPermissions(),
  };
};

// Prevent model recompilation in development
const WorkspaceMember =
  mongoose.models.WorkspaceMember ||
  mongoose.model('WorkspaceMember', WorkspaceMemberSchema);

export default WorkspaceMember;
