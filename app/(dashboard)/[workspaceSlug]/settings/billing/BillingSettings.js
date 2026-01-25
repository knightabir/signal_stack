'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
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
  Calendar,
  Clock,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load FAQ and PlansGrid components to give the "app is loading" feel.
const PlansGrid = lazy(() => import('./PlansGrid'));
const BillingFAQ = lazy(() => import('./BillingFAQ'));

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

const STATUS_COLORS = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  past_due: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  canceled: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  trialing: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  incomplete: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const STATUS_LABELS = {
  active: 'Active',
  past_due: 'Past Due',
  canceled: 'Canceled',
  trialing: 'Trial',
  incomplete: 'Incomplete',
};

export default function BillingSettings({ workspace, canManageBilling, isOwner }) {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  const [isLoading, setIsLoading] = useState(null);
  const [interval, setInterval] = useState('monthly');
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fade-in for skeleton effect
  const [renderSkeleton, setRenderSkeleton] = useState(true);

  useEffect(() => {
    // Artificial delay for initial visual skeleton (for lazy loading effect)
    const timer = setTimeout(() => setRenderSkeleton(false), 550);
    return () => clearTimeout(timer);
  }, []);

  // Fetch subscription details
  useEffect(() => {
    fetchSubscriptionData();
  }, [workspace.id]);

  const fetchSubscriptionData = async () => {
    try {
      const res = await fetch(`/api/billing/subscription?workspaceId=${workspace.id}`);
      const data = await res.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const currentPlan = PLANS[workspace.plan] || PLANS.free;

  // Skeleton Loading Component
  const Skeleton = ({ width = '100%', height = 24, className = '' }) => (
    <div
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`}
      style={{ width, height, minHeight: height }}
    />
  );

  if (renderSkeleton || isLoadingData) {
    return (
      <div className="max-w-4xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton width={40} height={40} className="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton width={200} height={28} />
            <Skeleton width={260} height={18} />
          </div>
        </div>
        {/* Success/Cancel message skeleton */}
        <Skeleton width="100%" height={52} className="my-2" />
        {/* Card Skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton width={52} height={52} className="rounded-xl" />
              <div>
                <Skeleton width={120} height={22} />
                <Skeleton width={56} height={16} className="mt-2" />
              </div>
            </div>
            <Skeleton width={120} height={32} className="rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </div>
        </div>
        {/* Invoice history skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <Skeleton width={160} height={22} className="mb-4" />
          <div className="space-y-2">
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
          </div>
        </div>
        {/* Plans grid skeleton */}
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton height={280} />
          <Skeleton height={280} />
          <Skeleton height={280} />
        </div>
        {/* FAQ skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <Skeleton width={160} height={18} className="mb-4" />
          <Skeleton height={24} />
          <Skeleton height={24} />
          <Skeleton height={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Billing & Plans</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your subscription and payment details</p>
        </div>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Successfully upgraded!</p>
            <p className="text-sm opacity-80">Your new features are now active.</p>
          </div>
        </div>
      )}
      {canceled && (
        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Checkout canceled</p>
            <p className="text-sm opacity-80">You can try again when you're ready.</p>
          </div>
        </div>
      )}

      {/* Current Subscription Card */}
      <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-6 relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                {currentPlan.icon ? (
                    <currentPlan.icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                ) : (
                    <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                )}
                </div>
                <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{currentPlan.name} Plan</h2>
                    {subscriptionData?.subscription?.status && (
                    <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border", STATUS_COLORS[subscriptionData.subscription.status] || STATUS_COLORS.active)}>
                        {STATUS_LABELS[subscriptionData.subscription.status] || subscriptionData.subscription.status}
                    </span>
                    )}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                   {workspace.billingInterval && (
                       <span>Billed {workspace.billingInterval}</span>
                   )}
                </div>
                </div>
            </div>
            {subscriptionData?.stripeCustomerId && canManageBilling && (
                <Button
                onClick={handleManageBilling}
                disabled={isLoading === 'portal'}
                variant="outline"
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                {isLoading === 'portal' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage in Stripe
                </Button>
            )}
            </div>

            {/* Subscription Details Grid */}
            {workspace.plan !== 'free' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Days Remaining */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    Days Left
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {subscriptionData?.daysRemaining ?? '-'}
                </p>
                </div>

                {/* Next Billing Date */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {subscriptionData?.subscription?.cancelAtPeriodEnd ? 'Ends On' : 'Renews'}
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {formatDate(subscriptionData?.subscription?.currentPeriodEnd)}
                </p>
                </div>

                {/* Amount */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
                    <Receipt className="w-3.5 h-3.5" />
                    Amount
                </div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    ${currentPlan.pricing[workspace.billingInterval || 'monthly']}
                </p>
                </div>

                {/* Payment Method */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
                    <CreditCard className="w-3.5 h-3.5" />
                    Method
                </div>
                {subscriptionData?.paymentMethod ? (
                    <div className="flex items-center gap-2">
                         <span className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{subscriptionData.paymentMethod.brand}</span>
                         <span className="text-zinc-500">•••• {subscriptionData.paymentMethod.last4}</span>
                    </div>
                ) : (
                    <p className="text-zinc-500 italic">No card</p>
                )}
                </div>
            </div>
            )}

            {/* Cancellation Warning */}
            {subscriptionData?.subscription?.cancelAtPeriodEnd && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                <p className="text-red-700 dark:text-red-400 font-medium">Subscription ending</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/70">
                    Your plan will be downgraded to Free on {formatDate(subscriptionData.subscription.currentPeriodEnd)}
                </p>
                </div>
            </div>
            )}

            {/* Past Due Warning */}
            {subscriptionData?.subscription?.status === 'past_due' && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                <p className="text-red-700 dark:text-red-400 font-medium">Payment past due</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/70">
                    Please update your payment method to avoid service interruption.
                </p>
                </div>
                {canManageBilling && (
                <Button
                    onClick={handleManageBilling}
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 border-0"
                >
                    Update Payment
                </Button>
                )}
            </div>
            )}
        </div>
      </Card>

      {/* Interval Toggle */}
      {workspace.plan === 'free' && (
        <div className="flex justify-center mt-8">
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                interval === 'monthly'
                  ? 'bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                interval === 'yearly'
                  ? 'bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Yearly <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] uppercase font-bold px-1.5 rounded">Save 17%</span>
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid - LAZY LOADED */}
      <Suspense
        fallback={
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-pulse h-[330px]" />
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-pulse h-[330px]" />
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-pulse h-[330px]" />
          </div>
        }
      >
        <PlansGrid
          PLANS={PLANS}
          workspace={workspace}
          interval={interval}
          isLoading={isLoading}
          canManageBilling={canManageBilling}
          handleUpgrade={handleUpgrade}
        />
      </Suspense>

      {/* Invoice History */}
      {subscriptionData?.invoices?.length > 0 && (
        <Card className="border-0 shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900">
           <CardContent className="p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-zinc-400" />
                Invoice History
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="pb-3 pl-2">Invoice</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {subscriptionData.invoices.map((invoice) => (
                    <tr key={invoice.id} className="text-sm group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 pl-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium font-mono text-xs">{invoice.number || 'Draft'}</span>
                        </td>
                        <td className="py-3 text-zinc-500 dark:text-zinc-400">
                        {formatDate(invoice.created)}
                        </td>
                        <td className="py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                            invoice.status === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : invoice.status === 'open'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}>
                            {invoice.status}
                        </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {invoice.hostedInvoiceUrl && (
                            <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"
                                title="View Invoice"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            )}
                            {invoice.invoicePdf && (
                            <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"
                                title="Download PDF"
                            >
                                <Download className="w-4 h-4" />
                            </a>
                            )}
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ LAZY LOADED */}
      <Suspense
        fallback={
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <Skeleton width={180} height={18} className="mb-4" />
            <Skeleton height={24} />
            <Skeleton height={24} />
            <Skeleton height={24} />
          </div>
        }
      >
        <BillingFAQ />
      </Suspense>
    </div>
  );
}
