'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ChevronUp,
  MessageSquare,
  Plus,
  Search,
  Filter,
  X,
  Loader2,
  ArrowLeft,
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

export default function PublicFeedbackBoard({ workspace }) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('votes');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      params.set('sort', sort);

      const res = await fetch(`/api/workspaces/${workspace.id}/feedback?${params}`);
      const data = await res.json();

      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspace.id, filter, sort]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleVote = async (feedbackId) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
      });
      const data = await res.json();

      // Update local state
      setFeedback((prev) =>
        prev.map((f) =>
          f.id === feedbackId
            ? { ...f, voteCount: data.voteCount, hasVoted: data.voted }
            : f
        )
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  // Filter by search
  const filteredFeedback = feedback.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
                <p className="text-sm text-slate-400">Share your feedback and ideas</p>
              </div>
            </div>
            <Button
              onClick={() => setShowSubmitModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Feedback
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            {Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="votes">Most Voted</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No feedback yet</h3>
            <p className="text-slate-400 mb-6">Be the first to share your ideas!</p>
            <Button onClick={() => setShowSubmitModal(true)}>
              Submit Feedback
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <FeedbackCard
                key={item.id}
                feedback={item}
                workspaceSlug={workspace.slug}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitFeedbackModal
          workspaceId={workspace.id}
          isLoggedIn={!!session?.user}
          allowAnonymous={workspace.settings?.allowAnonymousFeedback}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={() => {
            setShowSubmitModal(false);
            fetchFeedback();
          }}
        />
      )}
    </div>
  );
}

function FeedbackCard({ feedback, workspaceSlug, onVote }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
      <div className="flex gap-4">
        {/* Vote Button */}
        <button
          onClick={() => onVote(feedback.id)}
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border transition-colors ${
            feedback.hasVoted
              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-indigo-500'
          }`}
        >
          <ChevronUp className="w-5 h-5" />
          <span className="text-sm font-bold">{feedback.voteCount}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/p/${workspaceSlug}/feedback/${feedback.id}`}
            className="block group"
          >
            <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors">
              {feedback.title}
            </h3>
          </Link>

          {feedback.description && (
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">
              {feedback.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${
                FEEDBACK_STATUS_COLORS[feedback.status]
              }`}
            >
              {FEEDBACK_STATUS_LABELS[feedback.status]}
            </span>

            <span className="flex items-center gap-1 text-sm text-slate-500">
              <MessageSquare className="w-4 h-4" />
              {feedback.commentCount}
            </span>

            <span className="text-sm text-slate-500">
              by {feedback.author?.name || 'Anonymous'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitFeedbackModal({ workspaceId, isLoggedIn, allowAnonymous, onClose, onSubmit }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authorName: '',
    authorEmail: '',
    isAnonymous: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit feedback');
        setIsLoading(false);
        return;
      }

      onSubmit();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Submit Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What's your idea or feedback?"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Add more details about your feedback..."
              rows={4}
              maxLength={5000}
            />
          </div>

          {!isLoggedIn && allowAnonymous && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your name"
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-300">Submit anonymously</span>
              </label>
            </>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
