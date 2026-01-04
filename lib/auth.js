import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { User, Workspace, WorkspaceMember } from '@/models';

/**
 * Get the current session on the server
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return null;
  }

  await dbConnect();
  
  const user = await User.findById(session.user.id).lean();
  
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

/**
 * Get the current user's workspaces
 * @returns {Promise<Array>} Array of workspaces
 */
export async function getUserWorkspaces(userId) {
  await dbConnect();

  const memberships = await WorkspaceMember.find({ userId })
    .populate('workspaceId')
    .lean();

  return memberships.map((m) => ({
    ...m.workspaceId,
    _id: m.workspaceId._id.toString(),
    role: m.role,
  }));
}

/**
 * Get workspace by slug with member info
 * @param {string} slug - Workspace slug
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Workspace with member info or null
 */
export async function getWorkspaceBySlug(slug, userId) {
  await dbConnect();

  const workspace = await Workspace.findOne({ slug }).lean();

  if (!workspace) {
    return null;
  }

  const member = await WorkspaceMember.findOne({
    workspaceId: workspace._id,
    userId,
  }).lean();

  if (!member) {
    return null;
  }

  return {
    ...workspace,
    _id: workspace._id.toString(),
    ownerId: workspace.ownerId.toString(),
    membership: {
      role: member.role,
      joinedAt: member.joinedAt,
    },
  };
}

/**
 * Check if user is a member of the workspace
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Member object or null
 */
export async function getWorkspaceMember(workspaceId, userId) {
  await dbConnect();

  const member = await WorkspaceMember.findOne({ workspaceId, userId }).lean();

  if (!member) {
    return null;
  }

  return {
    ...member,
    _id: member._id.toString(),
    workspaceId: member.workspaceId.toString(),
    userId: member.userId.toString(),
  };
}

/**
 * Check if user has a specific permission in the workspace
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - User ID
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>}
 */
export async function hasWorkspacePermission(workspaceId, userId, permission) {
  await dbConnect();

  const member = await WorkspaceMember.findOne({ workspaceId, userId });

  if (!member) {
    return false;
  }

  return member.hasPermission(permission);
}
