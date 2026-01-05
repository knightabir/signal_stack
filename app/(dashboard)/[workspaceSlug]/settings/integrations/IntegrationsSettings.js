'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Slack,
  Webhook,
  Github,
  Check,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const EVENTS = [
  { id: 'feedback.created', label: 'New feedback submitted' },
  { id: 'feedback.voted', label: 'Feedback receives vote' },
  { id: 'roadmap.shipped', label: 'Roadmap item shipped' },
];

export default function IntegrationsSettings({ workspace, canEdit, featureAccess }) {
  const router = useRouter();
  const integrationsFeature = featureAccess?.integrations;
  const isLocked = integrationsFeature?.isLocked;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [slackUrl, setSlackUrl] = useState('');
  const [slackEvents, setSlackEvents] = useState(['feedback.created', 'roadmap.shipped']);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['feedback.created', 'roadmap.shipped']);

  useEffect(() => {
    fetchIntegrations();
  }, [workspace.id]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/integrations`);
      const result = await res.json();
      setData(result);
      setSlackEvents(result.slack?.events || []);
      setWebhookUrl(result.webhook?.url || '');
      setWebhookEvents(result.webhook?.events || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (isLocked) {
      router.push(`/${workspace.slug}/settings/billing`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/integrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slackWebhookUrl: slackUrl || undefined,
          slackEvents,
          webhookUrl,
          webhookEvents,
        }),
      });

      if (res.ok) {
        fetchIntegrations();
        setSlackUrl('');
      } else if (res.status === 403) {
        const data = await res.json();
        if (data.code === 'UPGRADE_REQUIRED') {
          router.push(`/${workspace.slug}/settings/billing`);
        }
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (isLocked) {
      router.push(`/${workspace.slug}/settings/billing`);
      return;
    }

    if (!confirm('Regenerate webhook secret? Current integrations using the old secret will break.')) return;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/integrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateSecret: true }),
      });

      if (res.ok) {
        const result = await res.json();
        setNewSecret(result.webhook?.secret);
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    }
  };

  const handleCopySecret = async () => {
    if (newSecret) {
      await navigator.clipboard.writeText(newSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleEvent = (eventId, type) => {
    if (type === 'slack') {
      setSlackEvents((prev) =>
        prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
      );
    } else {
      setWebhookEvents((prev) =>
        prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
      );
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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Integrations</h1>
            {isLocked && integrationsFeature.upgradeBadge && (
              <button
                onClick={() => router.push(`/${workspace.slug}/settings/billing`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
              >
                <Zap className="w-3 h-3" />
                {integrationsFeature.upgradeBadge.text}
              </button>
            )}
          </div>
          <p className="text-slate-400">Connect with external services</p>
        </div>
      </div>

      {/* Upgrade Banner for Locked Feature */}
      {isLocked && (
        <div
          onClick={() => router.push(`/${workspace.slug}/settings/billing`)}
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-5 cursor-pointer hover:border-amber-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-400">Upgrade to Pro for Integrations</h3>
              <p className="text-sm text-amber-400/70 mt-0.5">
                Connect Slack, custom webhooks, and GitHub. Available on Pro and Business plans.
              </p>
            </div>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white group-hover:scale-105 transition-transform">
              <Lock className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Slack Integration */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-700 rounded-lg">
            <Slack className="w-5 h-5 text-[#E01E5A]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Slack</h2>
            <p className="text-sm text-slate-400">Get notifications in your Slack channels</p>
          </div>
          {data?.slack?.isConfigured && (
            <span className="ml-auto px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
              Connected
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              disabled={!canEdit}
              placeholder={data?.slack?.webhookUrl || 'https://hooks.slack.com/services/...'}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Create an <a href="https://api.slack.com/messaging/webhooks" target="_blank" className="text-indigo-400 hover:underline">Incoming Webhook</a> in Slack
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notify on
            </label>
            <div className="space-y-2">
              {EVENTS.filter(e => e.id !== 'feedback.voted').map((event) => (
                <label key={event.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slackEvents.includes(event.id)}
                    onChange={() => toggleEvent(event.id, 'slack')}
                    disabled={!canEdit}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                  />
                  <span className="text-sm text-slate-300">{event.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Webhooks */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-700 rounded-lg">
            <Webhook className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Custom Webhooks</h2>
            <p className="text-sm text-slate-400">Send events to your own endpoints</p>
          </div>
          {data?.webhook?.url && (
            <span className="ml-auto px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
              Active
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Endpoint URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="https://your-api.com/webhook"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Webhook Secret
            </label>
            {newSecret ? (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={newSecret}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handleCopySecret} variant="ghost">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  {data?.webhook?.hasSecret ? 'Secret configured' : 'No secret configured'}
                </span>
                {canEdit && (
                  <Button onClick={handleRegenerateSecret} variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {data?.webhook?.hasSecret ? 'Regenerate' : 'Generate'}
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Use this secret to verify webhook signatures (X-Signature-256 header)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Events
            </label>
            <div className="space-y-2">
              {EVENTS.map((event) => (
                <label key={event.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(event.id)}
                    onChange={() => toggleEvent(event.id, 'webhook')}
                    disabled={!canEdit}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                  />
                  <span className="text-sm text-slate-300">{event.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-700 rounded-lg">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">GitHub</h2>
            <p className="text-sm text-slate-400">Link feedback to GitHub issues</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          You can link GitHub issues directly on individual feedback items. Go to any feedback item and add a GitHub issue URL.
        </p>
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
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
