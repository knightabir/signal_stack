'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  Check,
  X,
  ArrowLeft,
  CreditCard,
  Zap,
  Building,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLANS = {
  free: {
    name: 'Free',
    icon: Zap,
    description: 'Get started with basic feedback collection',
    features: [
      { text: 'Up to 50 feedback items', included: true },
      { text: 'Public feedback board', included: true },
      { text: 'Embeddable widget', included: false },
      { text: 'API access', included: false },
      { text: 'Remove branding', included: false },
    ],
    pricing: { monthly: 0, yearly: 0 },
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    description: 'For growing teams and products',
    features: [
      { text: 'Unlimited feedback', included: true },
      { text: 'Public feedback board', included: true },
      { text: 'Embeddable widget', included: true },
      { text: 'API access', included: true },
      { text: 'Remove branding', included: false },
    ],
    pricing: { monthly: 19, yearly: 190 },
    popular: true,
  },
  business: {
    name: 'Business',
    icon: Building,
    description: 'For larger organizations',
    features: [
      { text: 'Unlimited feedback', included: true },
      { text: 'Public feedback board', included: true },
      { text: 'Embeddable widget', included: true },
      { text: 'API access', included: true },
      { text: 'Remove branding', included: true },
    ],
    pricing: { monthly: 49, yearly: 490 },
  },
};

export default function BillingSettings({ workspace, canManageBilling, isOwner }) {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const [isLoading, setIsLoading] = useState(null);
  const [interval, setInterval] = useState('monthly');

  const handleUpgrade = async (plan) => {
    if (!canManageBilling || plan === 'free') return;

    setIsLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          plan,
          interval,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const currentPlan = PLANS[workspace.plan] || PLANS.free;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${workspace.slug}/settings`}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
          <p className="text-slate-400">Manage your subscription</p>
        </div>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
          🎉 Successfully upgraded! Your new features are now active.
        </div>
      )}
      {canceled && (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400">
          Checkout was canceled. You can try again when ready.
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">Current Plan</p>
            <h2 className="text-xl font-bold text-white mt-1">{currentPlan.name}</h2>
            {workspace.billingInterval && (
              <p className="text-sm text-slate-400 mt-1">
                Billed {workspace.billingInterval}
                {workspace.planExpiresAt && (
                  <> · Renews {new Date(workspace.planExpiresAt).toLocaleDateString()}</>
                )}
              </p>
            )}
            {workspace.subscriptionStatus === 'past_due' && (
              <p className="text-sm text-red-400 mt-1">⚠️ Payment past due</p>
            )}
          </div>
          {workspace.hasStripeCustomer && canManageBilling && (
            <Button
              onClick={handleManageBilling}
              disabled={isLoading === 'portal'}
              variant="ghost"
            >
              {isLoading === 'portal' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Manage Billing
            </Button>
          )}
        </div>
      </div>

      {/* Interval Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              interval === 'monthly'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              interval === 'yearly'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-green-400 text-xs ml-1">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const Icon = plan.icon;
          const isCurrent = key === workspace.plan;
          const price = plan.pricing[interval];

          return (
            <div
              key={key}
              className={`relative bg-slate-800/50 border rounded-xl p-6 ${
                plan.popular
                  ? 'border-indigo-500 ring-1 ring-indigo-500'
                  : 'border-slate-700/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  ${price}
                </span>
                {price > 0 && (
                  <span className="text-slate-400">
                    /{interval === 'yearly' ? 'year' : 'mo'}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-400 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-slate-300' : 'text-slate-500'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {canManageBilling ? (
                <Button
                  onClick={() => handleUpgrade(key)}
                  disabled={isCurrent || isLoading === key || key === 'free'}
                  className={`w-full ${
                    plan.popular && !isCurrent
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      : ''
                  }`}
                  variant={isCurrent ? 'ghost' : 'default'}
                >
                  {isLoading === key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : key === 'free' ? (
                    'Free Forever'
                  ) : (
                    'Upgrade'
                  )}
                </Button>
              ) : (
                <p className="text-xs text-center text-slate-500">
                  Contact workspace owner to manage billing
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-300 font-medium">Can I cancel anytime?</p>
            <p className="text-slate-400 mt-1">Yes! You can cancel your subscription at any time. Access continues until the end of your billing period.</p>
          </div>
          <div>
            <p className="text-slate-300 font-medium">What happens to my data if I downgrade?</p>
            <p className="text-slate-400 mt-1">Your data is safe. If you exceed the free plan limits, you'll just need to upgrade to add more feedback.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
