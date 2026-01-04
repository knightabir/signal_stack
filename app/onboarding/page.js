'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

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
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

const COMPANY_SIZES = [
  { value: 'solo', label: 'Just me', description: 'Solo founder or indie maker' },
  { value: '2-10', label: '2-10', description: 'Small team' },
  { value: '11-50', label: '11-50', description: 'Growing company' },
  { value: '51-200', label: '51-200', description: 'Mid-size company' },
  { value: '201-500', label: '201-500', description: 'Large company' },
  { value: '500+', label: '500+', description: 'Enterprise' },
];

const TEAMS = [
  { value: 'founder', label: 'Founder / CEO', icon: '👑' },
  { value: 'product', label: 'Product', icon: '📦' },
  { value: 'engineering', label: 'Engineering', icon: '⚙️' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'sales', label: 'Sales', icon: '💼' },
  { value: 'support', label: 'Support', icon: '🎧' },
  { value: 'other', label: 'Other', icon: '🔧' },
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

  // Check slug availability with debounce
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

  // Debounce slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.workspaceUrl) {
        checkSlugAvailability(formData.workspaceUrl);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.workspaceUrl, checkSlugAvailability]);

  // Auto-generate slug from workspace name
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

      // Update the session to reflect onboarding completion
      await update({
        onboardingCompleted: true,
        defaultWorkspace: {
          id: data.workspace.id,
          slug: data.workspace.slug,
          name: data.workspace.name,
        },
      });

      // Redirect to new workspace
      router.push(`/${data.workspace.slug}`);
      router.refresh();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  index < currentStep
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : index === currentStep
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 transition-all ${
                    index < currentStep ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Step 1: Workspace URL */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                  <Link2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose your workspace URL</h2>
                <p className="text-slate-400">This will be your unique URL for feedback and roadmap</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={formData.workspaceName}
                    onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="My Awesome Product"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Workspace URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      signalstack.com/
                    </span>
                    <input
                      type="text"
                      value={formData.workspaceUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className={`w-full pl-36 pr-12 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        slugError
                          ? 'border-red-500 focus:ring-red-500'
                          : slugAvailable
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-slate-600 focus:ring-indigo-500'
                      }`}
                      placeholder="my-product"
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingSlug ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      ) : slugAvailable ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : slugError ? (
                        <X className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {slugError && (
                    <p className="mt-2 text-sm text-red-400">{slugError}</p>
                  )}
                  {slugAvailable && (
                    <p className="mt-2 text-sm text-green-400">This URL is available!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Language */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Select your language</h2>
                <p className="text-slate-400">Choose the default language for your workspace</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setFormData((prev) => ({ ...prev, language: lang.code }))}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      formData.language === lang.code
                        ? 'bg-indigo-500/20 border-indigo-500 text-white'
                        : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Company Size */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">How large is your company?</h2>
                <p className="text-slate-400">This helps us tailor your experience</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFormData((prev) => ({ ...prev, companySize: size.value }))}
                    className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                      formData.companySize === size.value
                        ? 'bg-indigo-500/20 border-indigo-500 text-white'
                        : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-xl font-bold">{size.label}</span>
                    <span className="text-sm text-slate-400">{size.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Team */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">What team are you in?</h2>
                <p className="text-slate-400">Tell us about your role</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TEAMS.map((team) => (
                  <button
                    key={team.value}
                    onClick={() => setFormData((prev) => ({ ...prev, team: team.value }))}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      formData.team === team.value
                        ? 'bg-indigo-500/20 border-indigo-500 text-white'
                        : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-2xl">{team.icon}</span>
                    <span className="font-medium">{team.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {currentStep > 0 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Step indicator text */}
        <p className="text-center text-slate-500 text-sm mt-4">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
