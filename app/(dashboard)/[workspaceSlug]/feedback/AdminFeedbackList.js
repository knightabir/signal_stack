'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ChevronUp,
  Eye,
  EyeOff,
  Trash2,
  Merge,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Loader2,
  ArrowUpToLine,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEEDBACK_STATUS = {
  new: { label: 'New', color: 'bg-blue-500' },
  under_review: { label: 'Under Review', color: 'bg-yellow-500' },
  planned: { label: 'Planned', color: 'bg-purple-500' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  closed: { label: 'Closed', color: 'bg-slate-500' },
};

export default function AdminFeedbackList({ workspace, initialFeedback, canModerate }) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(null);

  const filteredFeedback = feedback.filter((f) => {
    if (!showHidden && f.isHidden) return false;
    if (filter !== 'all' && f.status !== filter) return false;
    if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = async (feedbackId, newStatus) => {
    setActionLoading(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleHidden = async (feedbackId, isHidden) => {
    setActionLoading(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !isHidden }),
      });

      if (res.ok) {
        setFeedback((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, isHidden: !isHidden } : f))
        );
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    setActionLoading(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, { method: 'DELETE' });

      if (res.ok) {
        setFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMerge = async (sourceId, targetId) => {
    setActionLoading(sourceId);
    try {
      const res = await fetch(`/api/feedback/${sourceId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedback((prev) =>
          prev
            .filter((f) => f.id !== sourceId)
            .map((f) =>
              f.id === targetId
                ? { ...f, voteCount: data.target.voteCount, commentCount: data.target.commentCount }
                : f
            )
        );
        setShowMergeModal(null);
      }
    } catch (error) {
      console.error('Failed to merge:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (feedbackId, stage) => {
    setActionLoading(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });

      if (res.ok) {
        // Update feedback status to planned
        setFeedback((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, status: 'planned' } : f))
        );
        setShowPromoteModal(null);
        alert('Feedback promoted to roadmap!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to promote');
      }
    } catch (error) {
      console.error('Failed to promote:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-slate-400">Manage and respond to user feedback</p>
        </div>
        <Link
          href={`/p/${workspace.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
        >
          <ExternalLink className="w-4 h-4" />
          View Public Board
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
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
          {Object.entries(FEEDBACK_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-slate-400">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
          />
          Show hidden
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {Object.entries(FEEDBACK_STATUS).map(([status, { label, color }]) => {
          const count = feedback.filter((f) => f.status === status && !f.isHidden).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`p-4 rounded-xl border transition-colors ${
                filter === status
                  ? 'bg-slate-700 border-indigo-500'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </button>
          );
        })}
      </div>

      {/* Feedback Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Feedback</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400 w-24">Votes</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400 w-32">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400 w-32">Date</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-400 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredFeedback.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  No feedback found
                </td>
              </tr>
            ) : (
              filteredFeedback.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-700/30 transition-colors ${
                    item.isHidden ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/p/${workspace.slug}/feedback/${item.id}`}
                      target="_blank"
                      className="font-medium text-white hover:text-indigo-400 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>by {item.author?.name || 'Unknown'}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {item.commentCount}
                      </span>
                      {item.isHidden && (
                        <span className="text-yellow-500">Hidden</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-slate-400">
                      <ChevronUp className="w-4 h-4" />
                      <span className="font-medium">{item.voteCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      disabled={!canModerate || actionLoading === item.id}
                      className={`px-2 py-1 text-sm rounded-lg border-0 text-white focus:ring-2 focus:ring-indigo-500 ${
                        FEEDBACK_STATUS[item.status]?.color || 'bg-slate-600'
                      }`}
                    >
                      {Object.entries(FEEDBACK_STATUS).map(([value, { label }]) => (
                        <option key={value} value={value} className="bg-slate-800">
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    {canModerate && (
                      <div className="flex items-center justify-end gap-1">
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            <button
                              onClick={() => setShowPromoteModal(item.id)}
                              className="p-2 text-slate-400 hover:text-green-400 rounded-lg hover:bg-slate-700"
                              title="Promote to Roadmap"
                            >
                              <ArrowUpToLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleHidden(item.id, item.isHidden)}
                              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                              title={item.isHidden ? 'Show' : 'Hide'}
                            >
                              {item.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setShowMergeModal(item.id)}
                              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                              title="Merge"
                            >
                              <Merge className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Merge Modal */}
      {showMergeModal && (
        <MergeModal
          sourceId={showMergeModal}
          feedback={feedback.filter((f) => f.id !== showMergeModal && !f.isHidden)}
          onMerge={handleMerge}
          onClose={() => setShowMergeModal(null)}
          isLoading={actionLoading === showMergeModal}
        />
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <PromoteModal
          feedbackId={showPromoteModal}
          onPromote={handlePromote}
          onClose={() => setShowPromoteModal(null)}
          isLoading={actionLoading === showPromoteModal}
        />
      )}
    </div>
  );
}

function MergeModal({ sourceId, feedback, onMerge, onClose, isLoading }) {
  const [targetId, setTargetId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Merge Feedback</h2>
          <p className="text-slate-400 text-sm mb-4">
            Select the feedback to merge this item into. Votes and comments will be transferred.
          </p>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select target feedback...</option>
            {feedback.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} ({f.voteCount} votes)
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onMerge(sourceId, targetId)}
              disabled={!targetId || isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Merge'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoteModal({ feedbackId, onPromote, onClose, isLoading }) {
  const [stage, setStage] = useState('planned');

  const stages = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'shipped', label: 'Shipped' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Promote to Roadmap</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-slate-400 text-sm">
            This will add the feedback to your public roadmap.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Roadmap Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {stages.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onPromote(feedbackId, stage)}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Promote'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

