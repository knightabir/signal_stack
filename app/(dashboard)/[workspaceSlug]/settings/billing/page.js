import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, WorkspaceMember } from '@/models';
import BillingSettings from './BillingSettings';

export const metadata = {
  title: 'Billing & Plans',
};

export default async function BillingSettingsPage({ params }) {
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
    <BillingSettings
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan || 'free',
        billingInterval: workspace.billingInterval,
        subscriptionStatus: workspace.subscriptionStatus,
        planExpiresAt: workspace.planExpiresAt?.toISOString() || null,
        hasStripeCustomer: !!workspace.stripeCustomerId,
      }}
      canEdit={member.hasPermission('settings:update')}
    />
  );
}
