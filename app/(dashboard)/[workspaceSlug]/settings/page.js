import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import GeneralSettings from './GeneralSettings';

export const metadata = {
  title: 'Settings',
};

export default async function SettingsPage({ params }) {
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

  return (
    <GeneralSettings
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description || '',
        primaryColor: workspace.settings?.primaryColor || '#6366f1',
        allowAnonymousFeedback: workspace.settings?.allowAnonymousFeedback ?? true,
        publicRoadmap: workspace.settings?.publicRoadmap ?? true,
        publicChangelog: workspace.settings?.publicChangelog ?? true,
      }}
      canEdit={member.hasPermission('settings:update')}
    />
  );
}
