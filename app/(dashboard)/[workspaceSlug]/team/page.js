import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember, User } from '@/models';
import TeamManagement from './TeamManagement';

export const metadata = {
  title: 'Team',
};

export default async function TeamPage({ params }) {
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
  const currentMember = await WorkspaceMember.findOne({
    workspaceId: workspace._id,
    userId: session.user.id,
  });

  if (!currentMember) {
    redirect('/');
  }

  // Get all members with user details
  const members = await WorkspaceMember.find({ workspaceId: workspace._id })
    .populate('userId', 'name email image')
    .lean();

  const formattedMembers = members.map((m) => ({
    id: m._id.toString(),
    role: m.role,
    userId: m.userId?._id?.toString(),
    name: m.userId?.name || 'Unknown',
    email: m.userId?.email || '',
    image: m.userId?.image || null,
    joinedAt: m.createdAt,
  }));

  return (
    <TeamManagement
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
      }}
      members={formattedMembers}
      currentUserId={session.user.id}
      canManage={currentMember.hasPermission('members:manage')}
    />
  );
}
