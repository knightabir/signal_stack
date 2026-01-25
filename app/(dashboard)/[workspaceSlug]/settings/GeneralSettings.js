'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Settings,
  Palette,
  Globe,
  Code,
  CreditCard,
  Plug,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage workspace preferences</p>
        </div>
        <Button asChild variant="outline" className="gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <Link href={`/p/${workspace.slug}`} target="_blank">
             View Public Board <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
             <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                        <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-lg">General Information</CardTitle>
                </div>
                <CardDescription>Basic details about your workspace.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!canEdit}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!canEdit}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors resize-none"
                        rows={3}
                        placeholder="What is this workspace for?"
                    />
                </div>
             </CardContent>
          </Card>

          {/* Branding */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
             <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 dark:bg-pink-500/10 rounded-lg">
                        <Palette className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <CardTitle className="text-lg">Branding</CardTitle>
                </div>
                <CardDescription>Customize the look of your public pages.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="color">Primary Color</Label>
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                disabled={!canEdit}
                                className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer p-0"
                            />
                        </div>
                        <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            disabled={!canEdit}
                            className="w-32 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-mono"
                        />
                    </div>
                </div>
             </CardContent>
          </Card>

          {/* Privacy & Access */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
             <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-lg">Privacy & Access</CardTitle>
                </div>
                <CardDescription>Control who can see and interact with your workspace.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                        <Label className="text-base font-medium">Allow anonymous feedback</Label>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Users can submit feedback without signing in</p>
                    </div>
                    <Switch
                        checked={allowAnonymous}
                        onCheckedChange={setAllowAnonymous}
                        disabled={!canEdit}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                        <Label className="text-base font-medium">Public roadmap</Label>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Anyone can view your product roadmap</p>
                    </div>
                    <Switch
                        checked={publicRoadmap}
                        onCheckedChange={setPublicRoadmap}
                        disabled={!canEdit}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                        <Label className="text-base font-medium">Public changelog</Label>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Anyone can view your changelog/announcements</p>
                    </div>
                    <Switch
                        checked={publicChangelog}
                        onCheckedChange={setPublicChangelog}
                        disabled={!canEdit}
                    />
                </div>
             </CardContent>
          </Card>

           {/* Save Button */}
           {canEdit && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] shadow-lg shadow-indigo-500/20"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saved ? (
                  '✓ Saved'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar / Quick Links */}
        <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Quick Links</h3>
            <div className="grid gap-4">
                {settingsLinks.map((link) => (
                    <Link key={link.name} href={link.href}>
                        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-sm transition-all cursor-pointer group">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2 text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    <link.icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{link.name}</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{link.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
