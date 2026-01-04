import { Workspace } from '@/models';
import dbConnect from '@/lib/db';
import { notFound } from 'next/navigation';
import PublicRoadmap from './PublicRoadmap';

export async function generateMetadata({ params }) {
  const { workspaceSlug } = await params;
  
  await dbConnect();
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    return { title: 'Not Found' };
  }
  
  return {
    title: `Roadmap - ${workspace.name}`,
    description: `See what's planned, in progress, and shipped for ${workspace.name}`,
  };
}

export default async function PublicRoadmapPage({ params }) {
  const { workspaceSlug } = await params;
  
  await dbConnect();
  const workspace = await Workspace.findOne({ slug: workspaceSlug }).lean();
  
  if (!workspace) {
    notFound();
  }
  
  return (
    <PublicRoadmap
      workspace={{
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
      }}
    />
  );
}
