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
  Megaphone,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Changelog</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Announce product updates</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <Link href={`/p/${workspace.slug}/changelog`} target="_blank">
               Public Feed <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowEditor(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Update
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
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
            <Megaphone className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No announcements yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
            Keep your users in the loop by publishing your first product update.
          </p>
          {canEdit && (
            <Button onClick={() => setShowEditor(true)}>Create Update</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white dark:bg-zinc-900 border rounded-xl p-5 shadow-sm transition-all ${
                announcement.isPublished 
                    ? 'border-zinc-200 dark:border-zinc-800' 
                    : 'border-yellow-200 dark:border-yellow-500/30 ring-1 ring-yellow-500/20 bg-yellow-50/30 dark:bg-yellow-500/5'
              }`}
            >
              <div className="flex items-start gap-5">
                 <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <span className="text-xs font-normal text-zinc-500 uppercase tracking-widest">{new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xl leading-none">{new Date(announcement.publishedAt || announcement.createdAt).getDate()}</span>
                 </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-3 mb-1.5 justify-between sm:justify-start">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">{announcement.title}</h3>
                    {!announcement.isPublished && (
                      <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                    {announcement.content || 'No content provided'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    <span className="sm:hidden">{formatDate(announcement.publishedAt || announcement.createdAt)}</span>
                    {(announcement.linkedFeedback?.length > 0 || announcement.linkedRoadmap?.length > 0) && (
                        <div className="flex items-center gap-3">
                             {announcement.linkedFeedback?.length > 0 && (
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {announcement.linkedFeedback.length} feedback
                                </span>
                             )}
                             {announcement.linkedRoadmap?.length > 0 && (
                                 <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {announcement.linkedRoadmap.length} roadmap
                                 </span>
                             )}
                        </div>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-col sm:flex-row items-center gap-1 ml-auto shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleTogglePublish(announcement.id, announcement.isPublished)}
                      className={`h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                        announcement.isPublished ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'
                      }`}
                      title={announcement.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {announcement.isPublished ? <Check className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingItem(announcement);
                        setShowEditor(true);
                      }}
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(announcement.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
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
      </Dialog>
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
    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <DialogTitle>{announcement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's new in this version?"
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Content (Markdown supported)
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the new features, improvements, and fixes..."
              className="min-h-[150px] bg-white dark:bg-zinc-900 font-mono text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Link Feedback */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Linked Feedback
                </label>
                <ScrollArea className="h-40 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-2">
                {feedbackOptions.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-zinc-400">No feedback items</div>
                ) : (
                    <div className="space-y-1">
                        {feedbackOptions.map((f) => (
                        <label
                            key={f.id}
                            className="flex items-start gap-2 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                            <Checkbox
                                checked={linkedFeedbackIds.includes(f.id)}
                                onCheckedChange={() => toggleFeedback(f.id)}
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{f.title}</p>
                                <p className="text-[10px] text-zinc-500">{f.voteCount} votes</p>
                            </div>
                        </label>
                        ))}
                    </div>
                )}
                </ScrollArea>
            </div>

            {/* Link Roadmap */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Linked Roadmap
                </label>
                <ScrollArea className="h-40 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-2">
                {roadmapOptions.length === 0 ? (
                     <div className="flex items-center justify-center h-full text-xs text-zinc-400">No roadmap items</div>
                ) : (
                    <div className="space-y-1">
                        {roadmapOptions.map((r) => (
                        <label
                            key={r.id}
                            className="flex items-start gap-2 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                             <Checkbox
                                checked={linkedRoadmapIds.includes(r.id)}
                                onCheckedChange={() => toggleRoadmap(r.id)}
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{r.title}</p>
                                <p className="text-[10px] text-zinc-500 capitalize">{r.stage.replace('_', ' ')}</p>
                            </div>
                        </label>
                        ))}
                    </div>
                )}
                </ScrollArea>
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Checkbox 
                id="publish-toggle"
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(!!checked)}
            />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="publish-toggle"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Publish immediately
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    If unchecked, this will be saved as a draft visible only to admins.
                </p>
            </div>
         </div>
        </form>

        <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 mt-auto">
             <Button variant="ghost" type="button" disabled={isLoading} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              onClick={handleSubmit} // Using onClick here because the button is outside the form
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Announcement'}
            </Button>
        </DialogFooter>
    </DialogContent>
  );
}
