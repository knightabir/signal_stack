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
  Mail,
  User,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

const ROLE_STYLES = {
  owner: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  admin: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  viewer: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
};

export default function TeamManagement({ workspace, members, currentUserId, canManage }) {
  const [memberList, setMemberList] = useState(members);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  
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
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Team Members</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage who has access to this workspace</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Member List */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{memberList.length} Active Members</span>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {memberList.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role] || Eye;
                const isCurrentUser = member.userId === currentUserId;
                const isOwner = member.role === 'owner';
                const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.viewer;

                return (
                <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group"
                >
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-800">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                             {member.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{member.name}</span>
                        {isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500">You</Badge>
                        )}
                    </div>
                    <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.email}</span>
                    </div>
                    </div>

                    {/* Role Badge */}
                    <Badge variant="outline" className={cn("gap-1.5 py-1 px-2.5 font-medium border capitalize", roleStyle)}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[member.role]}
                    </Badge>

                    {/* Actions */}
                    {canManage && !isOwner && !isCurrentUser && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => handleRoleChange(member.id, 'admin')}
                                    disabled={member.role === 'admin'}
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Make Admin
                                    {member.role === 'admin' && <Check className="w-3 h-3 ml-auto opacity-50" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => handleRoleChange(member.id, 'viewer')}
                                    disabled={member.role === 'viewer'}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Make Viewer
                                    {member.role === 'viewer' && <Check className="w-3 h-3 ml-auto opacity-50" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                    onClick={() => handleRemove(member.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove Member
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                );
            })}
            </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Invite Teammate</DialogTitle>
                <DialogDescription>
                    Invite a new member to join your workspace.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 py-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        <Input
                            type="email"
                            placeholder="colleague@company.com"
                            className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Role</label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-zinc-500" />
                                    <span>Viewer</span>
                                    <span className="ml-2 text-zinc-400 text-xs">- Can view and comment</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-indigo-500" />
                                    <span>Admin</span>
                                    <span className="ml-2 text-zinc-400 text-xs">- Full access to manage content</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter className="pt-4">
                    <Button variant="outline" type="button" onClick={() => setShowInviteModal(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        Send Invite
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
