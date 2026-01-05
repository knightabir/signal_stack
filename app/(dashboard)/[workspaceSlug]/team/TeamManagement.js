'use client';

import { useState } from 'react';
import {
  Loader2,
  Users,
  UserPlus,
  Crown,
  Shield,
  Eye,
  MoreVertical,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  viewer: Eye,
};

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  viewer: 'Viewer',
};

const ROLE_COLORS = {
  owner: 'text-yellow-400 bg-yellow-400/10',
  admin: 'text-indigo-400 bg-indigo-400/10',
  viewer: 'text-slate-400 bg-slate-400/10',
};

export default function TeamManagement({ workspace, members, currentUserId, canManage }) {
  const [memberList, setMemberList] = useState(members);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemberList((prev) => [...prev, {
          id: data.member.id,
          role: data.member.role,
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          image: null,
          joinedAt: new Date().toISOString(),
        }]);
        setInviteEmail('');
        setShowInviteModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to invite');
      }
    } catch (error) {
      console.error('Failed to invite:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member from the workspace?')) return;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMemberList((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch (error) {
      console.error('Failed to remove:', error);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (res.ok) {
        setMemberList((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
    setOpenMenu(null);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-400">Manage workspace members</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Member List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">{memberList.length} members</span>
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {memberList.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role] || Eye;
            const isCurrentUser = member.userId === currentUserId;
            const isOwner = member.role === 'owner';

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-700/30 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {member.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{member.name}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-slate-500">(you)</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400 truncate">{member.email}</span>
                </div>

                {/* Role Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                  <RoleIcon className="w-3 h-3" />
                  {ROLE_LABELS[member.role]}
                </div>

                {/* Actions */}
                {canManage && !isOwner && !isCurrentUser && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenu === member.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 overflow-hidden">
                        <div className="p-1">
                          <button
                            onClick={() => handleRoleChange(member.id, 'admin')}
                            disabled={member.role === 'admin'}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 rounded disabled:opacity-50"
                          >
                            <Shield className="w-4 h-4" />
                            Make Admin
                          </button>
                          <button
                            onClick={() => handleRoleChange(member.id, 'viewer')}
                            disabled={member.role === 'viewer'}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 rounded disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4" />
                            Make Viewer
                          </button>
                          <div className="border-t border-slate-600 my-1" />
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Invite Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="colleague@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="viewer">Viewer - Can view and vote</option>
                  <option value="admin">Admin - Can manage content</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Invite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
