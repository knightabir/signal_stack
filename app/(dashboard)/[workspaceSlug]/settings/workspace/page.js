import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember, Feedback, RoadmapItem, Announcement } from '@/models';
import { ACTIONS, hasPermission } from '@/lib/rbac';
import WorkspaceManager from './WorkspaceManager';

export const metadata = {
  title: 'Workspace Manager',
};

export default async function WorkspaceManagerPage({ params }) {
  const { workspaceSlug } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  await dbConnect();

  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  if (!workspace) {
    redirect('/');
  }

  // Check membership
  const member = await WorkspaceMember.findOne({
    workspaceId: workspace._id,
    userId: session.user.id,
  });

  if (!member) {
    redirect('/');
  }

  const isOwner = member.role === 'owner';
  const canDelete = hasPermission(member.role, ACTIONS.WORKSPACE_DELETE);

  // Get workspace stats for deletion warning
  const [feedbackCount, roadmapCount, announcementCount, memberCount] = await Promise.all([
    Feedback.countDocuments({ workspaceId: workspace._id }),
    RoadmapItem.countDocuments({ workspaceId: workspace._id }),
    Announcement.countDocuments({ workspaceId: workspace._id }),
    WorkspaceMember.countDocuments({ workspaceId: workspace._id }),
  ]);

  return (
    <WorkspaceManager
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan || 'free',
        createdAt: workspace.createdAt?.toISOString(),
      }}
      stats={{
        feedbackCount,
        roadmapCount,
        announcementCount,
        memberCount,
      }}
      isOwner={isOwner}
      canDelete={canDelete}
    />
  );
}
