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
  Circle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STAGES = [
  {
    key: 'planned',
    label: 'Planned',
    icon: Circle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderColor: 'border-amber-200 dark:border-amber-500/20',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    borderColor: 'border-blue-200 dark:border-blue-500/20',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-200 dark:border-emerald-500/20',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Roadmap</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Plan and track product development</p>
        </div>
        <Button asChild variant="outline" className="gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <Link href={`/p/${workspace.slug}/roadmap`} target="_blank">
            Public Board <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key, roadmap[stage.key].length)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 rounded-t-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", stage.bg)}>
                        <stage.icon className={cn("w-4 h-4", stage.color)} />
                    </div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{stage.label}</h3>
                </div>
                <Badge variant="secondary" className="bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-mono">
                    {roadmap[stage.key]?.length || 0}
                </Badge>
              </div>

              {/* Items Area */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                {roadmap[stage.key]?.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                        "group relative bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-200",
                        canEdit ? "cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md" : "",
                        draggingItem?.id === item.id ? "opacity-40 border-dashed border-zinc-400" : ""
                    )}
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
                     <div className="flex items-start gap-3">
                         {canEdit && <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                         <div className="flex-1 min-w-0">
                             <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">{item.title}</h4>
                             {item.description && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                    {item.description}
                                </p>
                             )}
                             
                             {(item.feedback || canEdit) && (
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-2">
                                    {item.feedback ? (
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                <ChevronUp className="w-3 h-3" />
                                                {item.feedback.voteCount}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                <MessageSquare className="w-3 h-3" />
                                                {item.feedback.commentCount}
                                            </span>
                                        </div>
                                    ) : (
                                        canEdit && <span className="text-[10px] text-zinc-400 italic">Manual item</span>
                                    )}

                                    {canEdit && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                onClick={() => setShowEditModal(item)}
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                                                onClick={() => handleDelete(item.id, stage.key)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                             )}
                         </div>
                     </div>
                  </div>
                ))}
              </div>
              
              {/* Footer Action */}
              {canEdit && (
                  <div className="p-3 pt-0">
                    <Button
                        variant="ghost"
                        className="w-full border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 transition-all font-normal text-xs h-9"
                        onClick={() => setShowAddModal(stage.key)}
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Add Item
                    </Button>
                  </div>
              )}
            </div>
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
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            required
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            placeholder="Roadmap item title"
            maxLength={200}
            className="bg-white dark:bg-zinc-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            maxLength={2000}
            className="bg-white dark:bg-zinc-900 resize-none"
          />
        </div>
        <DialogFooter className="flex flex-row gap-2 pt-2">
          <Button variant="outline" type="button" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!itemTitle.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
