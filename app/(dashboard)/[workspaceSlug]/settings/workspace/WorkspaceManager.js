'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Building2,
  MessageSquare,
  Map,
  Bell,
  Users,
  Shield,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function WorkspaceManager({ workspace, stats, isOwner, canDelete }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== workspace.name) {
      setDeleteError('Please type the workspace name exactly to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to home after deletion
        router.push('/');
      } else {
        setDeleteError(data.error || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* Workspace Info */}
      <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Building2 className="w-8 h-8" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">{workspace.name}</h2>
                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                            {workspace.plan?.charAt(0).toUpperCase() + workspace.plan?.slice(1)} Plan
                        </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono mb-2">/{workspace.slug}</p>
                    
                    {workspace.createdAt && (
                        <p className="text-xs text-zinc-400">
                            Created on {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            })}
                        </p>
                    )}
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOwner ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Your Role</p>
                            <p className={`font-semibold ${isOwner ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {isOwner ? 'Workspace Owner' : 'Admin'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Workspace Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 hover:ring-indigo-200 dark:hover:ring-indigo-500/30 transition-all">
             <CardContent className="p-6 text-center">
                 <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-3">
                     <MessageSquare className="w-5 h-5 text-blue-500" />
                 </div>
                 <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.feedbackCount}</p>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Feedback</p>
             </CardContent>
          </Card>
          
          <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 hover:ring-purple-200 dark:hover:ring-purple-500/30 transition-all">
             <CardContent className="p-6 text-center">
                 <div className="mx-auto w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-3">
                     <Map className="w-5 h-5 text-purple-500" />
                 </div>
                 <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.roadmapCount}</p>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Roadmap Items</p>
             </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 hover:ring-green-200 dark:hover:ring-green-500/30 transition-all">
             <CardContent className="p-6 text-center">
                 <div className="mx-auto w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-3">
                     <Bell className="w-5 h-5 text-green-500" />
                 </div>
                 <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.announcementCount}</p>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Announcements</p>
             </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 hover:ring-orange-200 dark:hover:ring-orange-500/30 transition-all">
             <CardContent className="p-6 text-center">
                 <div className="mx-auto w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-3">
                     <Users className="w-5 h-5 text-orange-500" />
                 </div>
                 <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.memberCount}</p>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Members</p>
             </CardContent>
          </Card>
      </div>

      {/* Danger Zone */}
      {canDelete && (
        <Card className="border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Danger Zone</h3>
                    <p className="text-red-700/80 dark:text-red-400/70 text-sm mt-1 mb-4">
                        Deleting a workspace is irreversible. All data including feedback, roadmap items, announcements, and member associations will be permanently removed.
                    </p>
                    
                    <Button
                        onClick={() => setShowDeleteModal(true)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Workspace
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-lg font-bold">Delete Workspace</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-zinc-600 dark:text-zinc-300">
                This will permanently delete <strong className="text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{workspace.name}</strong> 
                {' '}and all of its data. This action cannot be undone.
              </p>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">The following will be lost:</p>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300/90 list-disc list-inside">
                    <li>{stats.feedbackCount} feedback items and votes</li>
                    <li>{stats.roadmapCount} roadmap items</li>
                    <li>{stats.announcementCount} announcements</li>
                    <li>{stats.memberCount} member associations</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  To confirm, type <span className="font-mono font-bold">{workspace.name}</span> below:
                </label>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type workspace name"
                  className="bg-white dark:bg-zinc-950 border-red-300 dark:border-red-900 focus:ring-red-500"
                />
              </div>

              {deleteError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{deleteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                  setDeleteError('');
                }}
                variant="outline"
                disabled={isDeleting}
                className="hover:bg-zinc-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== workspace.name}
                className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
