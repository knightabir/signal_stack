'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  ChevronUp,
  MessageSquare,
  X,
  Plus,
  ArrowLeft,
  Send,
} from 'lucide-react';

const FEEDBACK_STATUS_COLORS = {
  new: 'bg-blue-500',
  under_review: 'bg-yellow-500',
  planned: 'bg-purple-500',
  in_progress: 'bg-orange-500',
  completed: 'bg-green-500',
  closed: 'bg-slate-500',
};

export default function WidgetFeedback({ token }) {
  const [workspace, setWorkspace] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('list'); // list | submit
  const [votedItems, setVotedItems] = useState(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    // Apply theme
    if (workspace?.settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (workspace?.settings?.theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [workspace]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/widget/${token}`);
      if (!res.ok) {
        throw new Error('Widget not found');
      }
      const data = await res.json();
      setWorkspace(data.workspace);
      setFeedback(data.feedback);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (feedbackId) => {
    try {
      const res = await fetch(`/api/widget/${token}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback((prev) =>
          prev.map((f) =>
            f.id === feedbackId ? { ...f, voteCount: data.voteCount } : f
          )
        );
        if (data.voted) {
          setVotedItems((prev) => new Set([...prev, feedbackId]));
        } else {
          setVotedItems((prev) => {
            const next = new Set(prev);
            next.delete(feedbackId);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/widget/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          authorName: name.trim() || undefined,
          authorEmail: email.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTitle('');
        setDescription('');
        // Refresh feedback list
        fetchData();
        setTimeout(() => {
          setSubmitSuccess(false);
          setView('list');
        }, 2000);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = workspace?.settings?.theme === 'dark' || 
    (workspace?.settings?.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
  const inputClass = isDark
    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <p className={mutedClass}>Widget unavailable</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${bgClass} border-b ${borderClass}`}>
        <div className="px-4 py-3 flex items-center justify-between">
          {view === 'submit' ? (
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 ${mutedClass} hover:${textClass}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <h1 className={`text-lg font-bold ${textClass}`}>{workspace?.name}</h1>
          )}
          <button
            onClick={() => setView(view === 'list' ? 'submit' : 'list')}
            className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 flex items-center gap-1"
          >
            {view === 'list' ? (
              <>
                <Plus className="w-4 h-4" />
                New
              </>
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {view === 'list' ? (
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <p className={`text-center py-8 ${mutedClass}`}>
                No feedback yet. Be the first!
              </p>
            ) : (
              feedback.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${borderClass} flex gap-3`}
                >
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`flex flex-col items-center px-2 py-1 rounded border transition-colors ${
                      votedItems.has(item.id)
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                        : `${borderClass} ${mutedClass} hover:border-indigo-500`
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.voteCount}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${textClass} truncate`}>{item.title}</h3>
                    {item.description && (
                      <p className={`text-sm ${mutedClass} line-clamp-2 mt-1`}>
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`w-2 h-2 rounded-full ${FEEDBACK_STATUS_COLORS[item.status]}`}
                      />
                      <span className={`text-xs ${mutedClass}`}>
                        {item.commentCount} comments
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChevronUp className="w-6 h-6 text-green-500" />
                </div>
                <p className={textClass}>Thanks for your feedback!</p>
              </div>
            ) : (
              <>
                <div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="What's your feedback?"
                    maxLength={200}
                  />
                </div>
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                    placeholder="Add more details..."
                    rows={3}
                  />
                </div>
                {workspace?.settings?.allowAnonymous ? (
                  <p className={`text-xs ${mutedClass}`}>
                    Submit anonymously or add your email below
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                    placeholder="Name (optional)"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={!workspace?.settings?.allowAnonymous}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                    placeholder={workspace?.settings?.allowAnonymous ? 'Email (optional)' : 'Email'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  className="w-full py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
