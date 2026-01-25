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
  Filter,
  MoreHorizontal,
  ArrowUpRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const FEEDBACK_STATUS = {
  new: { label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' },
  under_review: { label: 'Under Review', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20' },
  planned: { label: 'Planned', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
  closed: { label: 'Closed', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' },
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
      } else {
        const data = await res.json();
      }
    } catch (error) {
      console.error('Failed to promote:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const statusCounts = Object.keys(FEEDBACK_STATUS).reduce((acc, status) => {
    acc[status] = feedback.filter(f => f.status === status && !f.isHidden).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Feedback</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage and respond to user feedback</p>
        </div>
        <Button asChild variant="outline" className="gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <Link href={`/p/${workspace.slug}`} target="_blank">
            Public Board <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(FEEDBACK_STATUS).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilter(filter === status ? 'all' : status)}
            className={`
              flex flex-col p-4 rounded-xl border transition-all duration-200 text-left
              ${filter === status 
                ? 'bg-white dark:bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }
            `}
          >
            <span className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
               filter === status ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'
            }`}>
              {config.label}
            </span>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
             {/* Search */}
             <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                />
             </div>
             
             {/* Filters */}
             <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="flex items-center gap-2">
                    <Checkbox
                        id="show-hidden"
                        checked={showHidden}
                        onCheckedChange={(checked) => setShowHidden(!!checked)}
                    />
                    <label htmlFor="show-hidden" className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                        Show hidden
                    </label>
                 </div>
                 <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[140px] border-zinc-200 dark:border-zinc-800 hidden sm:flex">
                        <Filter className="w-3.5 h-3.5 mr-2 text-zinc-400" />
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
             </div>
        </div>

        <div className="relative overflow-x-auto">
           <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-800">
                <TableHead className="w-[40%] pl-6">Feedback</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                    No feedback found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedback.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800/50">
                    <TableCell className="pl-6">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                             {item.isHidden && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                    HIDDEN
                                </span>
                             )}
                             <Link href={`/p/${workspace.slug}/feedback/${item.id}`} target="_blank" className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1">
                                {item.title}
                             </Link>
                         </div>
                         <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {item.commentCount}
                            </span>
                            <span>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {item.author?.name || 'Anonymous'}
                            </span>
                            {item.author?.email && (
                                <span className="text-xs text-zinc-500">
                                    {item.author.email}
                                </span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200">
                            <ChevronUp className="w-3 h-3 mr-1" />
                            {item.voteCount}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="w-[140px]" onClick={(e) => e.stopPropagation()}>
                            <Select
                                value={item.status}
                                onValueChange={(value) => handleStatusChange(item.id, value)}
                                disabled={actionLoading === item.id}
                            >
                                <SelectTrigger className={`h-8 border-0 ring-1 ring-inset ${FEEDBACK_STATUS[item.status]?.color?.replace('text-', 'ring-').split(' ')[0]} bg-transparent`}>
                                   <div className={`w-2 h-2 rounded-full mr-2 ${FEEDBACK_STATUS[item.status]?.color?.replace('bg-', 'bg-').split(' ')[0].replace('/10', '')}`} />
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(FEEDBACK_STATUS).map(([value, config]) => (
                                    <SelectItem key={value} value={value}>
                                        {config.label}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                                  <MoreHorizontal className="w-4 h-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={() => setShowPromoteModal(item.id)}>
                                  <ArrowUpToLine className="w-4 h-4 mr-2" />
                                  Promote
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowMergeModal(item.id)}>
                                  <Merge className="w-4 h-4 mr-2" />
                                  Merge
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleHidden(item.id, item.isHidden)}>
                                  {item.isHidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                                  {item.isHidden ? "Show" : "Hide"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/10">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
              {f.title} <span className="text-xs ml-2 text-zinc-500">({f.voteCount} votes)</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!targetId || isLoading}
          onClick={() => onMerge(sourceId, targetId)}
          className="bg-indigo-600 hover:bg-indigo-700"
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
          className="block text-sm font-medium text-zinc-500 mb-2"
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
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          onClick={() => onPromote(feedbackId, stage)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Promote'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
