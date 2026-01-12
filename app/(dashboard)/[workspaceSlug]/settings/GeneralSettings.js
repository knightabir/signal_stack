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
  CardFooter,
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
             <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-400" />
                    <CardTitle>General Information</CardTitle>
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
                        className="bg-slate-900/50 border-slate-600"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!canEdit}
                        className="bg-slate-900/50 border-slate-600 resize-none"
                        rows={3}
                        placeholder="What is this workspace for?"
                    />
                </div>
             </CardContent>
          </Card>

          {/* Branding */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
             <CardHeader>
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-400" />
                    <CardTitle>Branding</CardTitle>
                </div>
                <CardDescription>Customize the look of your public pages.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="color">Primary Color</Label>
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-600">
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
                            className="w-32 bg-slate-900/50 border-slate-600 font-mono"
                        />
                    </div>
                </div>
             </CardContent>
          </Card>

          {/* Privacy & Access */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
             <CardHeader>
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-400" />
                    <CardTitle>Privacy & Access</CardTitle>
                </div>
                <CardDescription>Control who can see and interact with your workspace.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">Allow anonymous feedback</Label>
                        <p className="text-sm text-slate-400">Users can submit feedback without signing in</p>
                    </div>
                    <Switch
                        checked={allowAnonymous}
                        onCheckedChange={setAllowAnonymous}
                        disabled={!canEdit}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">Public roadmap</Label>
                        <p className="text-sm text-slate-400">Anyone can view your product roadmap</p>
                    </div>
                    <Switch
                        checked={publicRoadmap}
                        onCheckedChange={setPublicRoadmap}
                        disabled={!canEdit}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label className="text-base">Public changelog</Label>
                        <p className="text-sm text-slate-400">Anyone can view your changelog/announcements</p>
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
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 font-medium shadow-lg shadow-indigo-500/25 min-w-[120px]"
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
            <h3 className="text-lg font-semibold text-white">More Settings</h3>
            <div className="grid gap-4">
                {settingsLinks.map((link) => (
                    <Link key={link.name} href={link.href}>
                        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-700/50 transition-colors cursor-pointer">
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                                    <link.icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-medium text-white leading-none">{link.name}</h4>
                                    <p className="text-xs text-slate-400">{link.description}</p>
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
