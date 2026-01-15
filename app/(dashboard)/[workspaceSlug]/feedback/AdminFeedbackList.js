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
  ExternalLink,
  Loader2,
  ArrowUpToLine,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

const FEEDBACK_STATUS = {
  new: { label: 'New', color: 'bg-blue-500', badge: 'bg-blue-500/20 text-blue-400' },
  under_review: { label: 'Under Review', color: 'bg-yellow-500', badge: 'bg-yellow-500/20 text-yellow-500' },
  planned: { label: 'Planned', color: 'bg-purple-500', badge: 'bg-purple-500/20 text-purple-500' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500', badge: 'bg-orange-500/20 text-orange-400' },
  completed: { label: 'Completed', color: 'bg-green-500', badge: 'bg-green-500/20 text-green-400' },
  closed: { label: 'Closed', color: 'bg-slate-500', badge: 'bg-slate-600/20 text-slate-400' },
};

export default function AdminFeedbackList({ workspace, initialFeedback, canModerate }) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
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
        setFeedback((prev) =>
          prev.map((f) => (f.id === feedbackId ? { ...f, status: 'planned' } : f))
        );
        setShowPromoteModal(null);
        // You may use a toast here instead of alert for shadcn
        // toast.success("Feedback promoted to roadmap!");
      } else {
        const data = await res.json();
        // toast.error(data.error || 'Failed to promote');
      }
    } catch (error) {
      console.error('Failed to promote:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Feedback</h1>
          <p className="text-muted-foreground">Manage and respond to user feedback</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/p/${workspace.slug}`} target="_blank">
            <ExternalLink className="w-4 h-4" />
            View Public Board
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-end gap-4">
        <div className="flex w-full gap-4">
          {/* Search Bar - 80% width */}
          <div className="relative w-full sm:w-[80%]">
            <Input
              type="text"
              aria-label="Search feedback"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
          {/* Filter and Show Hidden together - 20% width */}
          <div className="flex items-center gap-4 w-full sm:w-[20%]">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(FEEDBACK_STATUS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={(checked) => setShowHidden(!!checked)}
              />
              <label htmlFor="show-hidden" className="text-sm text-muted-foreground cursor-pointer">
                Show hidden
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {Object.entries(FEEDBACK_STATUS).map(([status, { label, color, badge }]) => {
          const count = feedback.filter((f) => f.status === status && !f.isHidden).length;
          const isActive = filter === status;
          return (
            <Card
              key={status}
              className={`cursor-pointer rounded-xl transition-shadow duration-150 ${
                isActive ? 'ring-2 ring-indigo-400 border-indigo-500 bg-muted/40' : "hover:ring-1 hover:ring-muted border-muted"
              }`}
              onClick={() => setFilter(status)}
              tabIndex={0}
              aria-pressed={isActive}
              role="button"
            >
              <CardContent className="flex flex-col items-center py-2 px-2 gap-1">
                <div className={`w-2 h-2 rounded-full mb-1 ${color}`} aria-label={label}></div>
                <span className="text-xl font-bold">{count}</span>
                <Badge className={`mt-1 rounded-md px-2 py-1 font-semibold ${badge}`} variant="outline">
                  {label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feedback Table */}
      <Card className="overflow-x-auto border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feedback</TableHead>
                <TableHead className="w-24">Votes</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-32">Date</TableHead>
                <TableHead className="w-32 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-lg">
                    No feedback found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedback.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`${item.isHidden ? 'opacity-50' : ''} hover:bg-muted`}
                  >
                    <TableCell>
                      <Link
                        href={`/p/${workspace.slug}/feedback/${item.id}`}
                        target="_blank"
                        className="font-semibold hover:underline"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>
                          by <span className="font-medium">{item.author?.name || 'Unknown'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {item.commentCount}
                        </span>
                        {item.isHidden && (
                          <Badge variant="destructive" className="ml-2 px-2 py-0">
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground font-medium">
                        <ChevronUp className="w-4 h-4" />
                        <span>{item.voteCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canModerate ? (
                        <Select
                          value={item.status}
                          onValueChange={(value) => handleStatusChange(item.id, value)}
                          disabled={actionLoading === item.id}
                        >
                          <SelectTrigger
                            className={`w-full text-xs ${FEEDBACK_STATUS[item.status]?.badge || ''}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FEEDBACK_STATUS).map(([value, { label }]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`rounded-sm px-2 py-0.5 font-medium ${FEEDBACK_STATUS[item.status]?.badge || ''}`}>
                          {FEEDBACK_STATUS[item.status]?.label || "Unknown"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {canModerate && (
                        <div className="flex items-center justify-end gap-1 pr-2">
                          {actionLoading === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowPromoteModal(item.id)}
                                title="Promote to Roadmap"
                                className="hover:bg-green-100 group"
                              >
                                <ArrowUpToLine className="w-4 h-4 group-hover:text-green-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleToggleHidden(item.id, item.isHidden)}
                                title={item.isHidden ? 'Show' : 'Hide'}
                              >
                                {item.isHidden ? (
                                  <Eye className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowMergeModal(item.id)}
                                title="Merge"
                              >
                                <Merge className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                title="Delete"
                                className="hover:bg-red-100 group"
                              >
                                <Trash2 className="w-4 h-4 group-hover:text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Merge Modal */}
      <Dialog open={!!showMergeModal} onOpenChange={() => setShowMergeModal(null)}>
        <MergeModal
          open={!!showMergeModal}
          sourceId={showMergeModal}
          feedback={feedback.filter((f) => f.id !== showMergeModal && !f.isHidden)}
          onMerge={handleMerge}
          onClose={() => setShowMergeModal(null)}
          isLoading={actionLoading === showMergeModal}
        />
      </Dialog>

      {/* Promote Modal */}
      <Dialog open={!!showPromoteModal} onOpenChange={() => setShowPromoteModal(null)}>
        <PromoteModal
          open={!!showPromoteModal}
          feedbackId={showPromoteModal}
          onPromote={handlePromote}
          onClose={() => setShowPromoteModal(null)}
          isLoading={actionLoading === showPromoteModal}
        />
      </Dialog>
    </div>
  );
}

function MergeModal({ open, sourceId, feedback, onMerge, onClose, isLoading }) {
  const [targetId, setTargetId] = useState('');

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Merge Feedback</DialogTitle>
        <DialogDescription>
          Select the feedback item to merge <span className="font-semibold text-foreground">this</span> into. Votes and comments will be transferred.
        </DialogDescription>
      </DialogHeader>
      <Select value={targetId} onValueChange={setTargetId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select target feedback..." />
        </SelectTrigger>
        <SelectContent>
          {feedback.length === 0 && (
            <SelectItem value="" disabled>No available feedback</SelectItem>
          )}
          {feedback.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.title} <span className="text-xs ml-2 text-muted-foreground">({f.voteCount} votes)</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!targetId || isLoading}
          onClick={() => onMerge(sourceId, targetId)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Merge'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PromoteModal({ open, feedbackId, onPromote, onClose, isLoading }) {
  const [stage, setStage] = useState('planned');
  const stages = [
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'shipped', label: 'Shipped' },
  ];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Promote to Roadmap</DialogTitle>
        <DialogDescription>
          This will add the feedback to your public roadmap.
        </DialogDescription>
      </DialogHeader>
      <div>
        <label
          htmlFor="promote-select"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Roadmap Stage
        </label>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger id="promote-select" className="w-full">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          onClick={() => onPromote(feedbackId, stage)}
          className="bg-gradient-to-r from-green-500 to-emerald-600"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Promote'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
