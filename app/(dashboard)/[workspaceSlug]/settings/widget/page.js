import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import WidgetSettings from './WidgetSettings';
import { getFeatureAccessMap } from '@/lib/featureGating';

export const metadata = {
  title: 'Widget Settings',
};

export default async function WidgetSettingsPage({ params }) {
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

  // Get feature access for current plan
  const currentPlan = workspace.plan || 'free';
  const featureAccess = getFeatureAccessMap(currentPlan);

  return (
    <WidgetSettings
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        plan: currentPlan,
      }}
      canEdit={member.hasPermission('settings:update')}
      featureAccess={featureAccess}
    />
  );
}

