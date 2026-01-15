'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  GripVertical,
  ChevronUp,
  MessageSquare,
  CircleDot,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const STAGES = [
  {
    key: 'planned',
    label: 'Planned',
    icon: CircleDot,
    color: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: CheckCircle2,
    color: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400',
  },
];

export default function AdminRoadmap({ workspace, canEdit }) {
  const [roadmap, setRoadmap] = useState({
    planned: [],
    in_progress: [],
    shipped: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);

  useEffect(() => {
    fetchRoadmap();
    // eslint-disable-next-line
  }, [workspace.id]);

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/roadmap`);
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e, item, stage) => {
    setDraggingItem({ ...item, sourceStage: stage });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage, targetIndex) => {
    e.preventDefault();
    if (!draggingItem || !canEdit) return;

    const newOrder = targetIndex;

    // Optimistic update
    const newRoadmap = { ...roadmap };
    newRoadmap[draggingItem.sourceStage] = newRoadmap[draggingItem.sourceStage]
      .filter((item) => item.id !== draggingItem.id);

    const itemToAdd = { ...draggingItem, stage: targetStage, order: newOrder };
    delete itemToAdd.sourceStage;
    newRoadmap[targetStage].splice(targetIndex, 0, itemToAdd);

    setRoadmap(newRoadmap);
    setDraggingItem(null);

    // API call
    try {
      await fetch('/api/roadmap/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: draggingItem.id,
          newStage: targetStage,
          newOrder,
        }),
      });
    } catch (error) {
      console.error('Failed to reorder:', error);
      fetchRoadmap();
    }
  };

  const handleDelete = async (itemId, stage) => {
    if (!window.confirm('Delete this roadmap item?')) return;

    setRoadmap((prev) => ({
      ...prev,
      [stage]: prev[stage].filter((item) => item.id !== itemId),
    }));

    try {
      await fetch(`/api/roadmap/${itemId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete:', error);
      fetchRoadmap();
    }
  };

  const handleAddItem = async (title, description, stage) => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, stage }),
      });

      if (res.ok) {
        fetchRoadmap();
        setShowAddModal(null);
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleEditItem = async (itemId, title, description) => {
    try {
      const res = await fetch(`/api/roadmap/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        fetchRoadmap();
        setShowEditModal(null);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  return (
    <div className="space-y-8 max-w-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Roadmap</h1>
          <p className="text-slate-400">Plan and track product development</p>
        </div>
        <Link
          href={`/p/${workspace.slug}/roadmap`}
          target="_blank"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
        >
          <ExternalLink className="w-4 h-4" />
          View Public Roadmap
        </Link>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STAGES.map((stage) => (
            <Card
              key={stage.key}
              className={`bg-transparent space-y-4 shadow-none`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key, roadmap[stage.key].length)}
            >
              <CardHeader className={`flex flex-row items-center gap-2 rounded-t-lg py-3 px-4 ${stage.badge}`}>
                <stage.icon className={`w-5 h-5 ${stage.color}`} />
                <CardTitle className={`text-base font-semibold ${stage.color} pr-2`}>
                  {stage.label}
                </CardTitle>
                <span className="ml-auto text-sm text-slate-400">
                  {roadmap[stage.key]?.length || 0}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[200px] px-4 pb-4 pt-0">
                {roadmap[stage.key]?.map((item, index) => (
                  <Card
                    key={item.id}
                    className={`bg-slate-900 rounded-xl px-4 py-3 transition-all ${
                      canEdit ? 'cursor-grab hover:border-slate-700' : ''
                    } ${draggingItem?.id === item.id ? 'opacity-50' : ''}`}
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, item, stage.key)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, stage.key, index);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {canEdit && (
                        <GripVertical className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white truncate">{item.title}</h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {item.feedback && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <ChevronUp className="w-3 h-3" />
                              {item.feedback.voteCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {item.feedback.commentCount}
                            </span>
                          </div>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex flex-col items-center gap-1 ml-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-slate-400 hover:text-white"
                            onClick={() => setShowEditModal(item)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-slate-400 hover:text-red-400"
                            onClick={() => handleDelete(item.id, stage.key)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {canEdit && (
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white bg-transparent flex items-center justify-center gap-2 mt-2"
                    onClick={() => setShowAddModal(stage.key)}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={!!showAddModal} onOpenChange={(open) => !open && setShowAddModal(null)}>
        <ItemModal
          title="Add Roadmap Item"
          stage={showAddModal}
          open={!!showAddModal}
          onSave={(title, desc) => handleAddItem(title, desc, showAddModal)}
          onClose={() => setShowAddModal(null)}
        />
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!showEditModal} onOpenChange={(open) => !open && setShowEditModal(null)}>
        <ItemModal
          title="Edit Roadmap Item"
          initialTitle={showEditModal?.title}
          initialDescription={showEditModal?.description}
          open={!!showEditModal}
          onSave={(title, desc) =>
            handleEditItem(showEditModal.id, title, desc)
          }
          onClose={() => setShowEditModal(null)}
        />
      </Dialog>
    </div>
  );
}

function ItemModal({
  title,
  initialTitle = '',
  initialDescription = '',
  stage,
  onSave,
  onClose,
  open,
}) {
  const [itemTitle, setItemTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form fields on open
  useEffect(() => {
    setItemTitle(initialTitle || '');
    setDescription(initialDescription || '');
  }, [open, initialTitle, initialDescription]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    setIsLoading(true);
    await onSave(itemTitle.trim(), description.trim());
    setIsLoading(false);
  };

  // Only render DialogContent if open
  if (!open) return null;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            required
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            placeholder="Roadmap item title"
            maxLength={200}
            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            maxLength={2000}
            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 resize-none"
          />
        </div>
        <DialogFooter className="flex flex-row gap-2 pt-2">
          <Button variant="ghost" type="button" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!itemTitle.trim() || isLoading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
