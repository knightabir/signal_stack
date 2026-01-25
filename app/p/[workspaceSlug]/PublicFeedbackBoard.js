'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ChevronUp,
  MessageSquare,
  Plus,
  Search,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
  Map as MapIcon,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const FEEDBACK_STATUS_LABELS = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const FEEDBACK_STATUS_COLORS = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
  planned: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  in_progress: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
};

export default function PublicFeedbackBoard({ workspace }) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('votes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Handle Theme
  useEffect(() => {
    // Check system preference initially
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

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
      // Optimistic update
      setFeedback((prev) =>
        prev.map((f) =>
          f.id === feedbackId
            ? { 
                ...f, 
                voteCount: f.hasVoted ? f.voteCount - 1 : f.voteCount + 1,
                hasVoted: !f.hasVoted 
              }
            : f
        )
      );

      const res = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        // Revert if failed (simplified)
        fetchFeedback();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      fetchFeedback();
    }
  };

  // Filter by search
  const filteredFeedback = feedback.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 font-sans text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500/30">
      
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {workspace.logo ? (
                 <img src={workspace.logo} alt={workspace.name} className="w-10 h-10 rounded-xl" />
              ) : (
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                  {workspace.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">{workspace.name}</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Feedback Board</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
               <Button
                onClick={() => setShowSubmitModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full px-6 shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Idea
              </Button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto px-6 py-8 pb-32">
        
        {/* Navigation Tabs (Simulated linkage) */}
        <div className="flex justify-center mb-8">
           <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
              <Link href={`/p/${workspace.slug}`} className="px-5 py-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Feedback
              </Link>
              <Link href={`/p/${workspace.slug}/roadmap`} className="px-5 py-2 rounded-full text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                Roadmap
              </Link>
               <Link href={`/p/${workspace.slug}/changelog`} className="px-5 py-2 rounded-full text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                Changelog
              </Link>
           </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text"
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
            </div>
             <div className="flex gap-2">
                 <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                   <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="votes">Most Voted</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
             </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
             <p className="text-sm text-zinc-500">Loading ideas...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
               <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No feedback found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs mx-auto">
               {searchQuery ? "Try adjusting your search terms" : "Be the first to share your ideas for this workspace!"}
            </p>
            <Button onClick={() => setShowSubmitModal(true)} variant="outline" className="border-zinc-300 dark:border-zinc-700">
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
      
      {/* Footer Branding */}
      <footer className="py-8 text-center border-t border-zinc-200 dark:border-zinc-900 mt-auto bg-white dark:bg-zinc-950">
         <a href="https://signalstack.com" target="_blank" className="inline-flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-xs font-semibold uppercase tracking-widest">Powered by Signalstack</span>
         </a>
      </footer>

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
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
      <div className="flex gap-5">
        {/* Vote Button */}
        <button
          onClick={() => onVote(feedback.id)}
          className={cn(
            "h-16 w-14 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300",
             "hover:-translate-y-0.5 active:translate-y-0",
             feedback.hasVoted
               ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20 shadow-inner"
               : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400"
          )}
        >
          <ChevronUp className={cn("w-6 h-6", feedback.hasVoted && "stroke-[3px]")} />
          <span className="text-sm font-bold">{feedback.voteCount}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <Link
            href={`/p/${workspaceSlug}/feedback/${feedback.id}`}
            className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-2">
              {feedback.title}
            </h3>
          </Link>

          {feedback.description && (
            <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-3">
              {feedback.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-3 mt-auto">
            <span
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                FEEDBACK_STATUS_COLORS[feedback.status]
              )}
            >
              {FEEDBACK_STATUS_LABELS[feedback.status]}
            </span>

            <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              <MessageSquare className="w-3.5 h-3.5" />
              {feedback.commentCount}
            </span>
             
             <span className="text-xs text-zinc-400 dark:text-zinc-600">
                •
             </span>

            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {feedback.author?.name || 'Anonymous'}
            </span>
            
            <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-600 font-medium">
               {formatDistanceToNow(new Date(feedback.createdAt))} ago
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Submit Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              placeholder="What's your idea?"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              placeholder="Add more details..."
              rows={4}
              maxLength={5000}
            />
          </div>

          {!isLoggedIn && allowAnonymous && (
            <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.authorEmail}
                      onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                       className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Submit anonymously</span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting
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
