'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Building2,
  MessageSquare,
  Map,
  Bell,
  Users,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${workspace.slug}/settings`}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Workspace Manager</h1>
          <p className="text-slate-400">Manage your workspace settings and data</p>
        </div>
      </div>

      {/* Workspace Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{workspace.name}</h2>
            <p className="text-sm text-slate-400">/{workspace.slug}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              workspace.plan === 'business' ? 'bg-purple-500/20 text-purple-400' :
              workspace.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
              'bg-slate-600/50 text-slate-400'
            }`}>
              {workspace.plan?.charAt(0).toUpperCase() + workspace.plan?.slice(1)} Plan
            </span>
          </div>
        </div>

        {workspace.createdAt && (
          <p className="text-sm text-slate-500">
            Created on {new Date(workspace.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Workspace Stats */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Workspace Data</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.feedbackCount}</p>
            <p className="text-xs text-slate-400">Feedback</p>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <Map className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.roadmapCount}</p>
            <p className="text-xs text-slate-400">Roadmap Items</p>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <Bell className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.announcementCount}</p>
            <p className="text-xs text-slate-400">Announcements</p>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <Users className="w-5 h-5 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.memberCount}</p>
            <p className="text-xs text-slate-400">Members</p>
          </div>
        </div>
      </div>

      {/* Access Level */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-slate-400" />
          <div>
            <p className="font-medium text-white">Your Access Level</p>
            <p className="text-sm text-slate-400">
              You are the <span className={`font-medium ${isOwner ? 'text-yellow-400' : 'text-indigo-400'}`}>
                {isOwner ? 'Owner' : 'Admin'}
              </span> of this workspace
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {canDelete && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-red-400">Danger Zone</h3>
          </div>

          <div className="p-4 bg-red-950/50 rounded-lg mb-4">
            <p className="text-sm text-red-300 mb-2">
              <strong>Warning:</strong> Deleting this workspace will permanently delete:
            </p>
            <ul className="text-sm text-red-300/80 list-disc list-inside space-y-1">
              <li>{stats.feedbackCount} feedback items and all votes/comments</li>
              <li>{stats.roadmapCount} roadmap items</li>
              <li>{stats.announcementCount} announcements</li>
              <li>All {stats.memberCount} member associations</li>
              <li>Widget tokens and settings</li>
              <li>Any active Stripe subscription</li>
            </ul>
            <p className="text-sm text-red-400 font-medium mt-3">
              This action cannot be undone!
            </p>
          </div>

          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Workspace
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-red-900/50 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-lg font-semibold">Delete Workspace</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                This will permanently delete <strong className="text-white">{workspace.name}</strong> 
                {' '}and all of its data. This action cannot be undone.
              </p>

              <div className="p-3 bg-red-950/50 rounded-lg text-sm text-red-300">
                <p className="font-medium">The following will be deleted:</p>
                <p className="mt-1 text-red-400/80">
                  {stats.feedbackCount} feedback · {stats.roadmapCount} roadmap items · 
                  {stats.announcementCount} announcements · {stats.memberCount} members
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Type <span className="text-white font-mono bg-slate-700 px-1 rounded">{workspace.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type workspace name"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-400">{deleteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                  setDeleteError('');
                }}
                variant="ghost"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== workspace.name}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
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
          </div>
        </div>
      )}
    </div>
  );
}
