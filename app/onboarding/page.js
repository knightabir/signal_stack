'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Link2,
  Globe,
  Building2,
  Users,
  Check,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'workspace', title: 'Workspace', icon: Link2 },
  { id: 'language', title: 'Language', icon: Globe },
  { id: 'company', title: 'Company', icon: Building2 },
  { id: 'team', title: 'Team', icon: Users },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

const COMPANY_SIZES = [
  { value: 'solo', label: 'Just me', description: 'Solo founder' },
  { value: '2-10', label: '2-10', description: 'Startup' },
  { value: '11-50', label: '11-50', description: 'Growing' },
  { value: '51-200', label: '51-200', description: 'Scaling' },
  { value: '201-500', label: '201+', description: 'Enterprise' },
];

const TEAMS = [
  { value: 'founder', label: 'Founder', icon: '👑' },
  { value: 'product', label: 'Product', icon: '📦' },
  { value: 'engineering', label: 'Eng', icon: '⚙️' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'marketing', label: 'Growth', icon: '🚀' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    workspaceName: '',
    workspaceUrl: '',
    language: 'en',
    companySize: '',
    team: '',
  });

  const checkSlugAvailability = useCallback(async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(false);
      setSlugError(slug.length > 0 ? 'URL must be at least 3 characters' : '');
      return;
    }

    setIsCheckingSlug(true);
    setSlugError('');

    try {
      const res = await fetch(`/api/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();

      setSlugAvailable(data.available);
      if (!data.available) {
        setSlugError(data.error || 'This URL is not available');
      }
    } catch (err) {
      setSlugError('Failed to check availability');
      setSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.workspaceUrl) {
        checkSlugAvailability(formData.workspaceUrl);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.workspaceUrl, checkSlugAvailability]);

  const handleWorkspaceNameChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      workspaceName: name,
      workspaceUrl: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50),
    }));
  };

  const handleUrlChange = (url) => {
    const cleaned = url
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50);
    
    setFormData((prev) => ({ ...prev, workspaceUrl: cleaned }));
    setSlugAvailable(false);
    setSlugError('');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.workspaceName.length > 0 && 
               formData.workspaceUrl.length >= 3 && 
               slugAvailable;
      case 1:
        return !!formData.language;
      case 2:
        return !!formData.companySize;
      case 3:
        return !!formData.team;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceName: formData.workspaceName,
          workspaceUrl: formData.workspaceUrl,
          language: formData.language,
          companySize: formData.companySize,
          team: formData.team,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to complete onboarding');
        setIsLoading(false);
        return;
      }

      await update({
        onboardingCompleted: true,
        defaultWorkspace: {
          id: data.workspace.id,
          slug: data.workspace.slug,
          name: data.workspace.name,
        },
      });

      router.push(`/${data.workspace.slug}`);
      router.refresh();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in');
    return null;
  }

  const StepIcon = STEPS[currentStep]?.icon || Zap;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 font-sans selection:bg-indigo-500/20">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />

      <div className="relative w-full max-w-lg space-y-8">
        
        {/* Progress Bar */}
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
                <span>Step {currentStep + 1} of {STEPS.length}</span>
                <span>{STEPS[currentStep].title}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-in-out" 
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                />
            </div>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <StepIcon className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {currentStep === 0 && "Name your workspace"}
                {currentStep === 1 && "Choose default language"}
                {currentStep === 2 && "Company size"}
                {currentStep === 3 && "Your role"}
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base">
                {currentStep === 0 && "Give your workspace a unique name and URL."}
                {currentStep === 1 && "Select the primary language for your public board."}
                {currentStep === 2 && "Help us tailor the experience for your team."}
                {currentStep === 3 && "What describes your role best?"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Step 1: Workspace URL */}
            {currentStep === 0 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                        <Label htmlFor="workspaceName">Workspace Name</Label>
                        <Input
                            id="workspaceName"
                            value={formData.workspaceName}
                            onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 h-11 text-lg"
                            placeholder="Acme Corp"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workspaceUrl">Workspace URL</Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-l-md border-r border-zinc-200 dark:border-zinc-800 pr-2 text-sm">
                                signalstack.com/
                            </div>
                            <Input
                                id="workspaceUrl"
                                value={formData.workspaceUrl}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                className={cn(
                                    "pl-[8.5rem] pr-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 h-11 font-medium",
                                    slugError && "border-red-500 focus:ring-red-500",
                                    slugAvailable && "border-emerald-500 focus:ring-emerald-500"
                                )}
                                placeholder="acme"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {isCheckingSlug ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                                ) : slugAvailable ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : slugError ? (
                                    <X className="h-4 w-4 text-red-500" />
                                ) : null}
                            </div>
                        </div>
                        {slugError && <p className="text-xs text-red-500 font-medium ml-1">{slugError}</p>}
                    </div>
                </div>
            )}

            {/* Step 2: Language */}
            {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                    {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setFormData((prev) => ({ ...prev, language: lang.code }))}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                            formData.language === lang.code
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-black"
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                        )}
                    >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                        {formData.language === lang.code && <Check className="ml-auto w-4 h-4 text-indigo-200" />}
                    </button>
                    ))}
                </div>
            )}

            {/* Step 3: Company Size */}
            {currentStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                    {COMPANY_SIZES.map((size) => (
                    <button
                        key={size.value}
                        onClick={() => setFormData((prev) => ({ ...prev, companySize: size.value }))}
                        className={cn(
                            "flex flex-col items-center p-4 rounded-xl border transition-all text-center hover:scale-[1.02] active:scale-[0.98]",
                            formData.companySize === size.value
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-black"
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                        )}
                    >
                        <span className="text-lg font-bold">{size.label}</span>
                        <span className={cn(
                            "text-xs mt-1",
                            formData.companySize === size.value ? "text-indigo-200" : "text-zinc-500 dark:text-zinc-400"
                        )}>{size.description}</span>
                    </button>
                    ))}
                </div>
            )}

            {/* Step 4: Team */}
            {currentStep === 3 && (
                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                    {TEAMS.map((team) => (
                    <button
                        key={team.value}
                        onClick={() => setFormData((prev) => ({ ...prev, team: team.value }))}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] gap-2",
                            formData.team === team.value
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-black"
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                        )}
                    >
                        <span className="text-3xl">{team.icon}</span>
                        <span className="font-medium text-sm">{team.label}</span>
                    </button>
                    ))}
                </div>
            )}
            
            {error && (
                <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800">
             <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={cn(
                    "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                    currentStep === 0 && "opacity-0 pointer-events-none"
                )}
             >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
             </Button>

             <Button
                onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext}
                disabled={!canProceed() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 min-w-[120px]"
             >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : currentStep === STEPS.length - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Finish
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
