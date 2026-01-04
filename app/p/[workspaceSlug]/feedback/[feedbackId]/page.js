import { Feedback, Workspace, Comment } from '@/models';
import dbConnect from '@/lib/db';
import { notFound } from 'next/navigation';
import FeedbackDetail from './FeedbackDetail';

export async function generateMetadata({ params }) {
  const { workspaceSlug, feedbackId } = await params;
  
  await dbConnect();
  const feedback = await Feedback.findById(feedbackId).populate('workspaceId').lean();
  
  if (!feedback || feedback.workspaceId.slug !== workspaceSlug) {
    return { title: 'Not Found' };
  }
  
  return {
    title: `${feedback.title} - ${feedback.workspaceId.name}`,
    description: feedback.description?.slice(0, 160) || `Feedback for ${feedback.workspaceId.name}`,
  };
}

export default async function FeedbackDetailPage({ params }) {
  const { workspaceSlug, feedbackId } = await params;
  
  await dbConnect();
  
  const feedback = await Feedback.findById(feedbackId)
    .populate('authorId', 'name image')
    .populate('workspaceId', 'name slug settings')
    .lean();
  
  if (!feedback || feedback.isHidden || feedback.workspaceId.slug !== workspaceSlug) {
    notFound();
  }
  
  // Get comments
  const comments = await Comment.getThreadedComments(feedbackId);
  
  return (
    <FeedbackDetail
      initialFeedback={{
        id: feedback._id.toString(),
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        voteCount: feedback.voteCount,
        commentCount: feedback.commentCount,
        author: feedback.authorId
          ? { name: feedback.authorId.name, image: feedback.authorId.image }
          : feedback.isAnonymous
          ? { name: 'Anonymous' }
          : { name: feedback.authorName || 'Guest' },
        createdAt: feedback.createdAt,
      }}
      workspace={{
        id: feedback.workspaceId._id.toString(),
        name: feedback.workspaceId.name,
        slug: feedback.workspaceId.slug,
      }}
      initialComments={comments.map(formatComment)}
    />
  );
}

function formatComment(comment) {
  return {
    id: comment._id.toString(),
    content: comment.content,
    isOfficial: comment.isOfficial,
    author: {
      id: comment.authorId._id.toString(),
      name: comment.authorId.name,
      image: comment.authorId.image,
    },
    createdAt: comment.createdAt,
    replies: comment.replies?.map(formatComment) || [],
  };
}
