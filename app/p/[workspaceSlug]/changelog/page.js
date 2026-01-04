import { Workspace } from '@/models';
import dbConnect from '@/lib/db';
import { notFound } from 'next/navigation';
import PublicChangelog from './PublicChangelog';

export async function generateMetadata({ params }) {
  const { workspaceSlug } = await params;
  
  await dbConnect();
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    return { title: 'Not Found' };
  }
  
  return {
    title: `Changelog - ${workspace.name}`,
    description: `Latest updates and announcements from ${workspace.name}`,
  };
}

export default async function PublicChangelogPage({ params }) {
  const { workspaceSlug } = await params;
  
  await dbConnect();
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    notFound();
  }
  
  return (
    <PublicChangelog
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
      }}
    />
  );
}
