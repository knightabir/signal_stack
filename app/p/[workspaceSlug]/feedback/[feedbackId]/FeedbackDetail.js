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
  User,
  MoreVertical,
  Share2,
  Flag,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const FEEDBACK_STATUS_LABELS = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const FEEDBACK_STATUS_STYLES = {
  new: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  under_review: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  planned: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  in_progress: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  completed: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  closed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
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
          setComments((prev) => addReplyToComment(prev, parentId, data.comment));
        } else {
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-indigo-500/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link
            href={`/p/${workspace.slug}`}
            className="group flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                 <ArrowLeft className="w-4 h-4" />
            </div>
            Back to {workspace.name}
          </Link>
          
          <div className="hidden sm:flex items-center gap-2">
             <Button variant="ghost" size="sm" className="gap-2 text-zinc-500 dark:text-zinc-400">
                <Share2 className="w-4 h-4" />
                Share
             </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Content */}
            <div className="lg:col-span-8 space-y-8">
                {/* Feedback Card */}
                <div className="space-y-6">
                     <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                                {feedback.title}
                            </h1>
                            {/* Vote Button Mobile */}
                            <button
                                onClick={handleVote}
                                className={cn(
                                    "flex lg:hidden flex-col items-center justify-center min-w-[3.5rem] p-2 rounded-xl border transition-all active:scale-95 duration-200",
                                    feedback.hasVoted
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400"
                                )}
                                >
                                <ChevronUp className={cn("w-5 h-5 mb-0.5", feedback.hasVoted && "animate-bounce")} />
                                <span className="text-sm font-bold">{feedback.voteCount}</span>
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                             <Badge variant="outline" className={cn("px-2.5 py-0.5 border font-medium capitalize", FEEDBACK_STATUS_STYLES[feedback.status])}>
                                {FEEDBACK_STATUS_LABELS[feedback.status]}
                             </Badge>
                             <span className="text-zinc-300 dark:text-zinc-700">|</span>
                             <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                <Avatar className="w-6 h-6 border border-zinc-100 dark:border-zinc-800">
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] text-white">
                                        {feedback.author?.name?.[0]?.toUpperCase() || 'A'}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{feedback.author?.name || 'Anonymous'}</span>
                             </div>
                             <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
                             <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                             </div>
                        </div>
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {feedback.description}
                        </p>
                    </div>

                     {/* Vote Button Desktop (Large prominent) */}
                     <div className="hidden lg:flex pt-4">
                        <Button
                            size="lg"
                            onClick={handleVote}
                            className={cn(
                                "h-12 px-6 text-base gap-2 rounded-xl transition-all duration-300",
                                feedback.hasVoted
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-black"
                                : "bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm"
                            )}
                        >
                            <ChevronUp className={cn("w-5 h-5", feedback.hasVoted && "animate-bounce")} />
                            {feedback.hasVoted ? 'Upvoted' : 'Upvote Feature'} 
                            <span className={cn("ml-1 font-bold", feedback.hasVoted ? "text-indigo-100" : "text-zinc-400")}>{feedback.voteCount}</span>
                        </Button>
                    </div>
                </div>

                <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                {/* Comments Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        Comments <span className="text-zinc-400 font-normal text-lg">({feedback.commentCount})</span>
                        </h3>
                    </div>

                    {/* Add Comment Form */}
                    {session?.user ? (
                        <Card className="border-0 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 hidden sm:block">
                                        <AvatarImage src={session.user.image} />
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                            {session.user.name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <Textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="What are your thoughts?"
                                            className="min-h-[100px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 resize-y focus:ring-indigo-500"
                                        />
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-zinc-500 hidden sm:block">
                                                Tip: Markdown is supported
                                            </p>
                                            <Button
                                                onClick={() => handleSubmitComment()}
                                                disabled={!newComment.trim() || isSubmitting}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                                            >
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                                Post Comment
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                         <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed border-zinc-200 dark:border-zinc-800">
                            <CardContent className="p-8 text-center space-y-3">
                                <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
                                <h4 className="text-zinc-900 dark:text-zinc-100 font-medium">Join the discussion</h4>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                                    Please <Link href="/sign-in" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">sign in</Link> to leave a comment and contribute to this feature request.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comments List */}
                    {comments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 dark:text-zinc-400">No comments yet. Start the conversation!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                        {comments.map((comment, index) => (
                            <div key={comment.id} className="relative">
                                {index !== comments.length - 1 && (
                                     <div className="absolute left-5 top-14 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 -z-10" />
                                )}
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
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            </div>
            
             {/* Right Column: Sidebar (Desktop only) */}
             <div className="hidden lg:block lg:col-span-4 space-y-6">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm sticky top-24">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-300">Upvotes</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{feedback.voteCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-300">Comments</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{feedback.commentCount}</span>
                        </div>
                         <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                         <div className="space-y-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase">Contributors</span>
                            <div className="flex -space-x-2 overflow-hidden py-1">
                                {[...Array(Math.min(5, feedback.voteCount || 1))].map((_, i) => (
                                    <Avatar key={i} className="inline-block border-2 border-white dark:border-zinc-900 w-8 h-8 ring-1 ring-zinc-50 dark:ring-zinc-800">
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[10px]">U</AvatarFallback>
                                    </Avatar>
                                ))}
                                {(feedback.voteCount || 0) > 5 && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500">
                                        +{feedback.voteCount - 5}
                                    </div>
                                )}
                            </div>
                         </div>
                    </CardContent>
                </Card>
             </div>
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
    <div className={cn("group", depth > 0 && "ml-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 mt-4")}>
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 mt-0.5 shrink-0">
             <AvatarImage src={comment.author.image} />
            <AvatarFallback className={cn(
                "text-white text-xs font-bold",
                comment.isOfficial ? "bg-indigo-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
            )}>
            {comment.author.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                {comment.author.name}
            </span>
            {comment.isOfficial && (
              <Badge variant="secondary" className="gap-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 border-0 h-5 px-1.5 text-[10px]">
                <CheckCircle2 className="w-3 h-3" />
                Team
              </Badge>
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            {isLoggedIn && (
                <button
                onClick={() => onReply(comment.id)}
                className="text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                <Reply className="w-3.5 h-3.5" />
                Reply
                </button>
            )}
             {/* Placeholder for future like/flag features
            <button className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors">
                Like
            </button>
             */}
          </div>

           {/* Reply Form */}
            {replyingTo === comment.id && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3">
                         <div className="w-8 h-8 shrink-0" /> {/* Spacer alignment */}
                         <div className="flex-1 space-y-2">
                            <Textarea
                                value={newComment}
                                autoFocus
                                onChange={(e) => onCommentChange(e.target.value)}
                                placeholder={`Reply to ${comment.author.name}...`}
                                className="min-h-[80px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => onReply(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => onSubmitReply(comment.id)}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : 'Reply'}
                                </Button>
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies?.length > 0 && (
                <div className="mt-4">
                    {comment.replies.map((reply) => (
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
            )}
        </div>
      </div>
    </div>
  );
}
