'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Slack,
  Webhook,
  Github,
  Check,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex items-center justify-center py-20 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Integrations</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Connect SignalStack with your favorite tools</p>
        </div>
        {canEdit && (
            <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
            </Button>
        )}
      </div>

      {/* Upgrade Banner for Locked Feature */}
      {isLocked && (
        <Card
          onClick={() => router.push(`/${workspace.slug}/settings/billing`)}
          className={cn(
            'w-full cursor-pointer border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all group pointer-events-auto shadow-sm'
          )}
        >
          <CardContent className="flex items-center gap-4 py-6">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-semibold text-amber-900 dark:text-amber-400 text-lg">
                Upgrade for Integrations
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-400/70 mt-0.5">
                 Connect Slack, custom webhooks, and GitHub issues. Available on Pro and Business plans.
              </CardDescription>
            </div>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${workspace.slug}/settings/billing`);
              }}
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Slack Integration */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-[#E01E5A]/10 rounded-xl border border-[#E01E5A]/20">
                    <Slack className="w-6 h-6 text-[#E01E5A]" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Slack</CardTitle>
                    <CardDescription>Send notifications to a Slack channel</CardDescription>
                </div>
             </div>
             {data?.slack?.isConfigured && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                    Connected
                </Badge>
            )}
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-3">
            <Label className="text-zinc-900 dark:text-zinc-100">Webhook URL</Label>
            <Input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              disabled={!canEdit}
              placeholder={data?.slack?.webhookUrl || 'https://hooks.slack.com/services/...'}
              className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Create an <a href="https://api.slack.com/messaging/webhooks" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center">Incoming Webhook <ArrowUpRight className="ml-0.5 w-3 h-3" /></a> in Slack and paste the URL here.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-900 dark:text-zinc-100">Trigger Events</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {EVENTS.filter(e => e.id !== 'feedback.voted').map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <Checkbox
                    id={`slack-${event.id}`}
                    checked={slackEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id, 'slack')}
                    disabled={!canEdit}
                  />
                  <label
                    htmlFor={`slack-${event.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300 cursor-pointer w-full"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Webhooks */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                    <Webhook className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Custom Webhooks</CardTitle>
                    <CardDescription>Send event payloads to your API</CardDescription>
                </div>
             </div>
             {data?.webhook?.url && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                    Active
                </Badge>
            )}
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-3">
            <Label className="text-zinc-900 dark:text-zinc-100">Endpoint URL</Label>
            <Input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="https://your-api.com/webhook"
              className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-900 dark:text-zinc-100">Signing Secret</Label>
            {newSecret ? (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-zinc-400" />
                  </div>
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={newSecret}
                    readOnly
                    className="pl-10 pr-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handleCopySecret} variant="outline" size="icon" className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {data?.webhook?.hasSecret ? 'Secret configured and hidden' : 'No signing secret generating'}
                </span>
                {canEdit && (
                  <Button onClick={handleRegenerateSecret} variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    {data?.webhook?.hasSecret ? 'Regenerate' : 'Generate'}
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Use this secret to verify webhook signatures using the <code>X-Signature-256</code> header.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-900 dark:text-zinc-100">Trigger Events</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {EVENTS.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <Checkbox
                    id={`webhook-${event.id}`}
                    checked={webhookEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id, 'webhook')}
                    disabled={!canEdit}
                  />
                  <label
                    htmlFor={`webhook-${event.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700 dark:text-zinc-300 cursor-pointer w-full"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Info */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="flex items-center gap-5 p-6">
           <div className="p-3 bg-black dark:bg-white rounded-xl shadow-lg shadow-black/10">
                <Github className="w-6 h-6 text-white dark:text-black" />
           </div>
           <div>
               <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">GitHub</h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                   Link feedback items directly to GitHub issues by pasting the issue URL in any feedback detail page.
               </p>
           </div>
           <div className="ml-auto hidden sm:block">
               <Button variant="outline" className="gap-2" asChild>
                   <a href="https://github.com" target="_blank" rel="noreferrer">
                       Open GitHub <ExternalLink className="w-4 h-4" />
                   </a>
               </Button>
           </div>
        </CardContent>
      </Card>
      
      {/* GitHub is mainly client-side linking, so no global config needed yet */}
    </div>
  );
}

function ExternalLink({ className }) {
    return <ArrowUpRight className={className} />
}
