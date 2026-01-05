import mongoose from 'mongoose';
import { ROLES, PERMISSIONS, hasPermission, getPermissionsForRole } from '@/lib/rbac';

// Re-export for backwards compatibility
export { ROLES, PERMISSIONS };

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
      enum: Object.values(ROLES).filter(r => r !== 'public'), // Exclude public
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

// Check if member has permission (uses centralized RBAC)
WorkspaceMemberSchema.methods.hasPermission = function (permission) {
  return hasPermission(this.role, permission);
};

// Get all permissions for this member
WorkspaceMemberSchema.methods.getPermissions = function () {
  return getPermissionsForRole(this.role);
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
