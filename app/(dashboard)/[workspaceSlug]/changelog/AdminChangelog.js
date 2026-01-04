'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminChangelog({ workspace, feedbackOptions, roadmapOptions, canEdit }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [workspace.id]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/changelog?drafts=true`);
      const data = await res.json();
      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Failed to fetch changelog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      const res = await fetch(`/api/changelog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleTogglePublish = async (id, isPublished) => {
    try {
      const res = await fetch(`/api/changelog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isPublished: !isPublished } : a))
        );
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };

  const handleSave = async (data) => {
    try {
      const url = editingItem
        ? `/api/changelog/${editingItem.id}`
        : `/api/workspaces/${workspace.id}/changelog`;

      const res = await fetch(url, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        fetchAnnouncements();
        setShowEditor(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Changelog</h1>
          <p className="text-slate-400">Announce product updates</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/p/${workspace.slug}/changelog`}
            target="_blank"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
          >
            <ExternalLink className="w-4 h-4" />
            View Public
          </Link>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowEditor(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No announcements yet</h3>
          <p className="text-slate-400 mb-6">Create your first changelog entry</p>
          {canEdit && (
            <Button onClick={() => setShowEditor(true)}>Create Announcement</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-slate-800/50 border rounded-xl p-4 ${
                announcement.isPublished ? 'border-slate-700/50' : 'border-yellow-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white truncate">{announcement.title}</h3>
                    {!announcement.isPublished && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {announcement.content || 'No content'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>{formatDate(announcement.publishedAt || announcement.createdAt)}</span>
                    <span>{announcement.linkedFeedback?.length || 0} feedback linked</span>
                    <span>{announcement.linkedRoadmap?.length || 0} roadmap linked</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePublish(announcement.id, announcement.isPublished)}
                      className={`p-2 rounded-lg hover:bg-slate-700 ${
                        announcement.isPublished ? 'text-green-400' : 'text-slate-400'
                      }`}
                      title={announcement.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {announcement.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(announcement);
                        setShowEditor(true);
                      }}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <AnnouncementEditor
          announcement={editingItem}
          feedbackOptions={feedbackOptions}
          roadmapOptions={roadmapOptions}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function AnnouncementEditor({ announcement, feedbackOptions, roadmapOptions, onSave, onClose }) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [content, setContent] = useState(announcement?.content || '');
  const [isPublished, setIsPublished] = useState(announcement?.isPublished || false);
  const [linkedFeedbackIds, setLinkedFeedbackIds] = useState(
    announcement?.linkedFeedback?.map((f) => f.id) || []
  );
  const [linkedRoadmapIds, setLinkedRoadmapIds] = useState(
    announcement?.linkedRoadmap?.map((r) => r.id) || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    await onSave({
      title: title.trim(),
      content: content.trim(),
      isPublished,
      linkedFeedbackIds,
      linkedRoadmapIds,
    });
    setIsLoading(false);
  };

  const toggleFeedback = (id) => {
    setLinkedFeedbackIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleRoadmap = (id) => {
    setLinkedRoadmapIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-xl my-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What's new?"
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content (Markdown supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
              placeholder="Describe the update..."
              rows={8}
            />
          </div>

          {/* Link Feedback */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Link Feedback Items
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-900/30 p-2 rounded-lg">
              {feedbackOptions.length === 0 ? (
                <p className="text-sm text-slate-500">No feedback available</p>
              ) : (
                feedbackOptions.slice(0, 20).map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={linkedFeedbackIds.includes(f.id)}
                      onChange={() => toggleFeedback(f.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                    />
                    <span className="text-sm text-slate-300 truncate">{f.title}</span>
                    <span className="text-xs text-slate-500 ml-auto">{f.voteCount} votes</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Link Roadmap */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Link Roadmap Items
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-900/30 p-2 rounded-lg">
              {roadmapOptions.length === 0 ? (
                <p className="text-sm text-slate-500">No roadmap items available</p>
              ) : (
                roadmapOptions.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={linkedRoadmapIds.includes(r.id)}
                      onChange={() => toggleRoadmap(r.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                    />
                    <span className="text-sm text-slate-300 truncate">{r.title}</span>
                    <span className="text-xs text-slate-500 ml-auto capitalize">{r.stage.replace('_', ' ')}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Publish Toggle */}
          <label className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-green-500"
            />
            <div>
              <span className="text-sm font-medium text-white">Publish immediately</span>
              <p className="text-xs text-slate-400">Make visible on public changelog</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
