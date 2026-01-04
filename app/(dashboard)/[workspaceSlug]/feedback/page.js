import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember, Feedback } from '@/models';
import AdminFeedbackList from './AdminFeedbackList';

export const metadata = {
  title: 'Feedback - Admin',
};

export default async function AdminFeedbackPage({ params }) {
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

  // Get all feedback (including hidden for admins)
  const feedbackList = await Feedback.find({
    workspaceId: workspace._id,
    mergedIntoId: null,
  })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name email')
    .lean();

  return (
    <AdminFeedbackList
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
      }}
      initialFeedback={feedbackList.map((f) => ({
        id: f._id.toString(),
        title: f.title,
        description: f.description,
        status: f.status,
        voteCount: f.voteCount,
        commentCount: f.commentCount,
        isHidden: f.isHidden,
        author: f.authorId
          ? { name: f.authorId.name, email: f.authorId.email }
          : f.isAnonymous
          ? { name: 'Anonymous' }
          : { name: f.authorName || 'Guest', email: f.authorEmail },
        createdAt: f.createdAt,
      }))}
      canModerate={member.hasPermission('feedback:moderate')}
    />
  );
}
