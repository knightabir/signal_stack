import { Workspace } from '@/models';
import dbConnect from '@/lib/db';
import { notFound } from 'next/navigation';
import PublicFeedbackBoard from './PublicFeedbackBoard';

export async function generateMetadata({ params }) {
  const { workspaceSlug } = await params;
  
  await dbConnect();
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    return { title: 'Not Found' };
  }
  
  return {
    title: `${workspace.name} - Feedback`,
    description: `Share your feedback and ideas for ${workspace.name}`,
  };
}

export default async function PublicFeedbackPage({ params }) {
  const { workspaceSlug } = await params;
  
  await dbConnect();
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    notFound();
  }
  
  return (
    <PublicFeedbackBoard
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        settings: workspace.settings,
      }}
    />
  );
}
