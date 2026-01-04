import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember, Feedback, RoadmapItem } from '@/models';
import AdminChangelog from './AdminChangelog';

export const metadata = {
  title: 'Changelog - Admin',
};

export default async function AdminChangelogPage({ params }) {
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

  // Get feedback and roadmap items for linking
  const [feedbackList, roadmapList] = await Promise.all([
    Feedback.find({ workspaceId: workspace._id, isHidden: false })
      .select('title voteCount status')
      .sort({ voteCount: -1 })
      .limit(50)
      .lean(),
    RoadmapItem.find({ workspaceId: workspace._id })
      .select('title stage')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return (
    <AdminChangelog
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
      }}
      feedbackOptions={feedbackList.map((f) => ({
        id: f._id.toString(),
        title: f.title,
        voteCount: f.voteCount,
        status: f.status,
      }))}
      roadmapOptions={roadmapList.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        stage: r.stage,
      }))}
      canEdit={member.hasPermission('changelog:update')}
    />
  );
}
