'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Settings,
  Palette,
  Globe,
  Shield,
  Code,
  CreditCard,
  Plug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GeneralSettings({ workspace, canEdit }) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [primaryColor, setPrimaryColor] = useState(workspace.primaryColor);
  const [allowAnonymous, setAllowAnonymous] = useState(workspace.allowAnonymousFeedback);
  const [publicRoadmap, setPublicRoadmap] = useState(workspace.publicRoadmap);
  const [publicChangelog, setPublicChangelog] = useState(workspace.publicChangelog);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          settings: {
            primaryColor,
            allowAnonymousFeedback: allowAnonymous,
            publicRoadmap,
            publicChangelog,
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const settingsLinks = [
    { name: 'Widget', href: `/${workspace.slug}/settings/widget`, icon: Code, description: 'Embed feedback on your site' },
    { name: 'Billing', href: `/${workspace.slug}/settings/billing`, icon: CreditCard, description: 'Manage subscription' },
    { name: 'Integrations', href: `/${workspace.slug}/settings/integrations`, icon: Plug, description: 'Connect external services' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your workspace settings</p>
      </div>

      {/* General Settings */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">General</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={3}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="What is this workspace for?"
          />
        </div>
      </div>

      {/* Branding */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Branding</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={!canEdit}
              className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={!canEdit}
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Privacy & Access</h2>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowAnonymous}
            onChange={(e) => setAllowAnonymous(e.target.checked)}
            disabled={!canEdit}
            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500"
          />
          <div>
            <span className="text-sm text-slate-300">Allow anonymous feedback</span>
            <p className="text-xs text-slate-500">Users can submit feedback without signing in</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={publicRoadmap}
            onChange={(e) => setPublicRoadmap(e.target.checked)}
            disabled={!canEdit}
            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500"
          />
          <div>
            <span className="text-sm text-slate-300">Public roadmap</span>
            <p className="text-xs text-slate-500">Anyone can view your product roadmap</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={publicChangelog}
            onChange={(e) => setPublicChangelog(e.target.checked)}
            disabled={!canEdit}
            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500"
          />
          <div>
            <span className="text-sm text-slate-300">Public changelog</span>
            <p className="text-xs text-slate-500">Anyone can view your changelog/announcements</p>
          </div>
        </label>
      </div>

      {/* Save Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : saved ? (
              '✓ Saved'
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}

      {/* Quick Links */}
      <div className="pt-4 border-t border-slate-700/50">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Other Settings</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {settingsLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-colors group"
            >
              <link.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 mb-2" />
              <p className="font-medium text-white text-sm">{link.name}</p>
              <p className="text-xs text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
