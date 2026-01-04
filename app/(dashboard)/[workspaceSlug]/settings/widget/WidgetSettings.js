'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WidgetSettings({ workspace, canEdit }) {
  const [settings, setSettings] = useState({
    enabled: false,
    position: 'bottom-right',
    theme: 'auto',
    buttonText: 'Feedback',
    allowAnonymous: true,
    token: null,
  });
  const [embedCode, setEmbedCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [workspace.id]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/widget`);
      const data = await res.json();
      if (data.widget) {
        setSettings(data.widget);
      }
      if (data.embedCode) {
        setEmbedCode(data.embedCode);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/widget`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!confirm('Generate a new token? The old embed code will stop working.')) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/widget`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, token: data.token }));
        setEmbedCode(data.embedCode);
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Widget Settings</h1>
          <p className="text-slate-400">Embed feedback collection on your website</p>
        </div>
      </div>

      {/* Enable Widget */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
            disabled={!canEdit}
            className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500"
          />
          <div>
            <span className="text-lg font-medium text-white">Enable Widget</span>
            <p className="text-sm text-slate-400 mt-1">
              Allow the feedback widget to be embedded on external websites
            </p>
          </div>
        </label>
      </div>

      {/* Embed Code */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Embed Code</h2>
        
        {settings.token ? (
          <div className="space-y-4">
            <div className="relative">
              <pre className="p-4 bg-slate-900 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono">
                {embedCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-slate-700 rounded hover:bg-slate-600 text-white"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Add this code before the closing <code className="text-indigo-400">&lt;/body&gt;</code> tag on your website
            </p>
            {canEdit && (
              <Button
                onClick={handleGenerateToken}
                disabled={isGenerating}
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Regenerate Token
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">Generate a token to get your embed code</p>
            {canEdit && (
              <Button
                onClick={handleGenerateToken}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Embed Code
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">Configuration</h2>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Button Position
          </label>
          <select
            value={settings.position}
            onChange={(e) => setSettings((prev) => ({ ...prev, position: e.target.value }))}
            disabled={!canEdit}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Widget Theme
          </label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value }))}
            disabled={!canEdit}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="auto">Auto (match system)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Button Text */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Button Text
          </label>
          <input
            type="text"
            value={settings.buttonText}
            onChange={(e) => setSettings((prev) => ({ ...prev, buttonText: e.target.value }))}
            disabled={!canEdit}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            maxLength={30}
          />
        </div>

        {/* Anonymous */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowAnonymous}
            onChange={(e) => setSettings((prev) => ({ ...prev, allowAnonymous: e.target.checked }))}
            disabled={!canEdit}
            className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500"
          />
          <span className="text-sm text-slate-300">Allow anonymous feedback submissions</span>
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
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        </div>
      )}

      {/* Preview Link */}
      {settings.token && (
        <div className="text-center">
          <Link
            href={`/widget/${settings.token}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
          >
            <ExternalLink className="w-4 h-4" />
            Preview Widget
          </Link>
        </div>
      )}
    </div>
  );
}
