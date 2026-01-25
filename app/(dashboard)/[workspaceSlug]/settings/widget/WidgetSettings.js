'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
  Code,
  Eye,
  Settings
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function WidgetSettings({ workspace, canEdit, featureAccess }) {
  const router = useRouter();
  const widgetFeature = featureAccess?.widget;
  const isLocked = widgetFeature?.isLocked;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (isLocked) {
      router.push(`/${workspace.slug}/settings/billing`);
      return;
    }

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
      } else if (res.status === 403) {
        const data = await res.json();
        if (data.code === 'UPGRADE_REQUIRED') {
          alert(`This feature requires the ${data.requiredPlan} plan. Click OK to upgrade.`);
          router.push(`/${workspace.slug}/settings/billing`);
        }
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
      <div className="w-full flex items-center justify-center py-20 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:pb-8">
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
                Upgrade to Pro for Widget Access
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-400/70 mt-0.5">
                Embed a beautiful feedback widget directly in your product. Available on Pro and Business plans.
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

      {/* Enable Widget */}
      <Card className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="flex items-center gap-4 py-6">
          <Switch
            checked={settings.enabled}
            onCheckedChange={(value) =>
              setSettings((prev) => ({ ...prev, enabled: value }))
            }
            disabled={!canEdit}
            id="enabled-switch"
          />
          <div>
            <Label htmlFor="enabled-switch" className="text-base text-zinc-900 dark:text-zinc-100 font-medium">
              Enable Widget
            </Label>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Allow the feedback widget to be embedded on external websites
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
         {/* Configuration */}
         <Card className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-zinc-500" />
                    <CardTitle className="text-zinc-900 dark:text-zinc-100 text-lg">Configuration</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
            {/* Position */}
            <div>
                <Label htmlFor="widget-position" className="block text-sm mb-2 text-zinc-700 dark:text-zinc-300">
                Button Position
                </Label>
                <Select
                value={settings.position}
                onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, position: value }))
                }
                disabled={!canEdit}
                >
                <SelectTrigger
                    id="widget-position"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                    <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
                </Select>
            </div>

            {/* Theme */}
            <div>
                <Label htmlFor="widget-theme" className="block text-sm mb-2 text-zinc-700 dark:text-zinc-300">
                Widget Theme
                </Label>
                <Select
                value={settings.theme}
                onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, theme: value }))
                }
                disabled={!canEdit}
                >
                <SelectTrigger
                    id="widget-theme"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                    <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="auto">Auto (match system)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
                </Select>
            </div>

            {/* Button Text */}
            <div>
                <Label htmlFor="button-text" className="block text-sm mb-2 text-zinc-700 dark:text-zinc-300">
                Button Text
                </Label>
                <Input
                type="text"
                id="button-text"
                value={settings.buttonText}
                onChange={(e) =>
                    setSettings((prev) => ({
                    ...prev,
                    buttonText: e.target.value,
                    }))
                }
                disabled={!canEdit}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                maxLength={30}
                />
            </div>

            {/* Anonymous */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                <Switch
                checked={settings.allowAnonymous}
                onCheckedChange={(value) =>
                    setSettings((prev) => ({ ...prev, allowAnonymous: value }))
                }
                disabled={!canEdit}
                id="allow-anonymous-switch"
                />
                <Label htmlFor="allow-anonymous-switch" className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                Allow anonymous feedback submissions
                </Label>
            </div>
            </CardContent>
        </Card>

        <div className="space-y-6">
            {/* Embed Code */}
            <Card className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-zinc-500" />
                        <CardTitle className="text-zinc-900 dark:text-zinc-100 text-lg">Embed Code</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                {settings.token ? (
                    <div className="space-y-4 flex-1">
                    <div className="relative">
                        <pre className="p-4 bg-zinc-950 dark:bg-black rounded-lg overflow-x-auto text-sm text-zinc-300 font-mono whitespace-pre-wrap border border-zinc-800">
                        {embedCode}
                        </pre>
                        <Button
                        size="icon"
                        variant="secondary"
                        onClick={handleCopy}
                        className="absolute top-2 right-2 h-8 w-8"
                        aria-label={copied ? "Copied!" : "Copy embed code"}
                        >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Add this code before the closing{' '}
                        <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-indigo-500 font-mono text-xs">&lt;/body&gt;</code> tag.
                    </div>
                    {canEdit && (
                        <div className="pt-4 mt-auto">
                            <Button
                            onClick={handleGenerateToken}
                            disabled={isGenerating}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center"
                            >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Regenerate Token
                            </Button>
                        </div>
                    )}
                    </div>
                ) : (
                    <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs mx-auto">
                        {isLocked
                        ? 'Upgrade to Pro to get your embed code'
                        : 'Generate a token to get your unique embed code'}
                    </p>
                    {canEdit && (
                        <Button
                        onClick={
                            isLocked
                            ? () => router.push(`/${workspace.slug}/settings/billing`)
                            : handleGenerateToken
                        }
                        disabled={isGenerating}
                        className={isLocked
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }
                        >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : isLocked ? (
                            <Lock className="w-4 h-4 mr-2" />
                        ) : null}
                        {isLocked ? 'Upgrade to Pro' : 'Generate Embed Code'}
                        </Button>
                    )}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Save Button */}
      {canEdit && (
        <div className="flex justify-between items-center w-full pt-4 border-t border-zinc-200 dark:border-zinc-800">
           {settings.token && (
             <Link
                href={`/widget/${settings.token}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm font-medium"
            >
                <Eye className="w-4 h-4" />
                Preview Widget
            </Link>
           )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white ml-auto"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
