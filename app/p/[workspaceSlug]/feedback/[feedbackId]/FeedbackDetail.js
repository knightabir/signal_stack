'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronUp,
  MessageSquare,
  Send,
  Loader2,
  Reply,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEEDBACK_STATUS_LABELS = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const FEEDBACK_STATUS_COLORS = {
  new: 'bg-blue-500',
  under_review: 'bg-yellow-500',
  planned: 'bg-purple-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-green-500',
  closed: 'bg-slate-500',
};

export default function FeedbackDetail({ initialFeedback, workspace, initialComments }) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState(initialFeedback);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const handleVote = async () => {
    try {
      const res = await fetch(`/api/feedback/${feedback.id}/vote`, { method: 'POST' });
      const data = await res.json();
      setFeedback((prev) => ({
        ...prev,
        voteCount: data.voteCount,
        hasVoted: data.voted,
      }));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleSubmitComment = async (parentId = null) => {
    if (!newComment.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/feedback/${feedback.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (parentId) {
          // Add reply to existing comment
          setComments((prev) => addReplyToComment(prev, parentId, data.comment));
        } else {
          // Add new top-level comment
          setComments((prev) => [...prev, { ...data.comment, replies: [] }]);
        }
        
        setNewComment('');
        setReplyingTo(null);
        setFeedback((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addReplyToComment = (comments, parentId, reply) => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), { ...reply, replies: [] }] };
      }
      if (comment.replies?.length) {
        return { ...comment, replies: addReplyToComment(comment.replies, parentId, reply) };
      }
      return comment;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/p/${workspace.slug}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to {workspace.name}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          {/* Header */}
          <div className="flex gap-4">
            {/* Vote Button */}
            <button
              onClick={handleVote}
              className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl border transition-colors ${
                feedback.hasVoted
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-indigo-500'
              }`}
            >
              <ChevronUp className="w-6 h-6" />
              <span className="text-lg font-bold">{feedback.voteCount}</span>
            </button>

            {/* Title & Meta */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{feedback.title}</h1>
              
              <div className="flex items-center gap-4 mt-3">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full text-white ${
                    FEEDBACK_STATUS_COLORS[feedback.status]
                  }`}
                >
                  {FEEDBACK_STATUS_LABELS[feedback.status]}
                </span>

                <span className="text-sm text-slate-400">
                  by {feedback.author?.name || 'Anonymous'}
                </span>

                <span className="text-sm text-slate-500">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {feedback.description && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-300 whitespace-pre-wrap">{feedback.description}</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({feedback.commentCount})
          </h2>

          {/* Add Comment Form */}
          {session?.user ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={() => handleSubmitComment()}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-slate-400">
                <Link href="/sign-in" className="text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
                {' '}to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onReply={(id) => setReplyingTo(id)}
                  replyingTo={replyingTo}
                  newComment={newComment}
                  onCommentChange={setNewComment}
                  onSubmitReply={handleSubmitComment}
                  isSubmitting={isSubmitting}
                  isLoggedIn={!!session?.user}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
  replyingTo,
  newComment,
  onCommentChange,
  onSubmitReply,
  isSubmitting,
  isLoggedIn,
  depth = 0,
}) {
  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {comment.author.name?.[0]?.toUpperCase() || 'U'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{comment.author.name}</span>
              {comment.isOfficial && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Official
                </span>
              )}
              <span className="text-sm text-slate-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <p className="mt-2 text-slate-300 whitespace-pre-wrap">{comment.content}</p>
            
            {isLoggedIn && (
              <button
                onClick={() => onReply(comment.id)}
                className="mt-2 text-sm text-slate-400 hover:text-indigo-400 flex items-center gap-1"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-4 ml-11">
            <textarea
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => onReply(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => onSubmitReply(comment.id)}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies?.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          onReply={onReply}
          replyingTo={replyingTo}
          newComment={newComment}
          onCommentChange={onCommentChange}
          onSubmitReply={onSubmitReply}
          isSubmitting={isSubmitting}
          isLoggedIn={isLoggedIn}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
