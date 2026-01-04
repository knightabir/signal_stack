'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  GripVertical,
  X,
  ChevronUp,
  MessageSquare,
  CircleDot,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STAGES = [
  { key: 'planned', label: 'Planned', icon: CircleDot, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/50' },
  { key: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/50' },
  { key: 'shipped', label: 'Shipped', icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50' },
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
    
    // Remove from source
    newRoadmap[draggingItem.sourceStage] = newRoadmap[draggingItem.sourceStage]
      .filter((item) => item.id !== draggingItem.id);
    
    // Add to target
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
      fetchRoadmap(); // Refresh on error
    }
  };

  const handleDelete = async (itemId, stage) => {
    if (!confirm('Delete this roadmap item?')) return;

    // Optimistic update
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
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            <div
              key={stage.key}
              className="space-y-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key, roadmap[stage.key].length)}
            >
              {/* Column Header */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${stage.bgColor} border ${stage.borderColor}`}>
                <stage.icon className={`w-5 h-5 ${stage.color}`} />
                <h2 className={`font-semibold ${stage.color}`}>{stage.label}</h2>
                <span className="ml-auto text-sm text-slate-400">
                  {roadmap[stage.key]?.length || 0}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-3 min-h-[200px]">
                {roadmap[stage.key]?.map((item, index) => (
                  <div
                    key={item.id}
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
                    className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 transition-all ${
                      canEdit ? 'cursor-grab hover:border-slate-600' : ''
                    } ${draggingItem?.id === item.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {canEdit && (
                        <GripVertical className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {item.feedback && (
                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, stage.key)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Button */}
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(stage.key)}
                  className="w-full p-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <ItemModal
          title="Add Roadmap Item"
          stage={showAddModal}
          onSave={(title, desc) => handleAddItem(title, desc, showAddModal)}
          onClose={() => setShowAddModal(null)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <ItemModal
          title="Edit Roadmap Item"
          initialTitle={showEditModal.title}
          initialDescription={showEditModal.description}
          onSave={(title, desc) => handleEditItem(showEditModal.id, title, desc)}
          onClose={() => setShowEditModal(null)}
        />
      )}
    </div>
  );
}

function ItemModal({ title, initialTitle = '', initialDescription = '', stage, onSave, onClose }) {
  const [itemTitle, setItemTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    setIsLoading(true);
    await onSave(itemTitle.trim(), description.trim());
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Roadmap item title"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Add more details..."
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!itemTitle.trim() || isLoading}
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
