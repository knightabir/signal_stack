'use client';

import { useState, useEffect } from 'react';
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

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  past_due: 'bg-red-500/20 text-red-400 border-red-500/30',
  canceled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  incomplete: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
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
          <p className="text-slate-400">Manage your subscription and payment details</p>
        </div>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Successfully upgraded!</p>
            <p className="text-sm opacity-80">Your new features are now active.</p>
          </div>
        </div>
      )}
      {canceled && (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Checkout canceled</p>
            <p className="text-sm opacity-80">You can try again when you're ready.</p>
          </div>
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
              <currentPlan.icon className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{currentPlan.name} Plan</h2>
                {subscriptionData?.subscription?.status && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[subscriptionData.subscription.status] || STATUS_COLORS.active}`}>
                    {STATUS_LABELS[subscriptionData.subscription.status] || subscriptionData.subscription.status}
                  </span>
                )}
              </div>
              {workspace.billingInterval && (
                <p className="text-sm text-slate-400 mt-1">
                  Billed {workspace.billingInterval}
                </p>
              )}
            </div>
          </div>
          {subscriptionData?.stripeCustomerId && canManageBilling && (
            <Button
              onClick={handleManageBilling}
              disabled={isLoading === 'portal'}
              variant="ghost"
              className="text-slate-400 hover:text-white"
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
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Days Remaining
              </div>
              <p className="text-2xl font-bold text-white">
                {subscriptionData?.daysRemaining ?? '-'}
              </p>
            </div>

            {/* Next Billing Date */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                {subscriptionData?.subscription?.cancelAtPeriodEnd ? 'Ends On' : 'Renews On'}
              </div>
              <p className="text-lg font-semibold text-white">
                {formatDate(subscriptionData?.subscription?.currentPeriodEnd)}
              </p>
            </div>

            {/* Amount */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Receipt className="w-4 h-4" />
                {workspace.billingInterval === 'yearly' ? 'Per Year' : 'Per Month'}
              </div>
              <p className="text-2xl font-bold text-white">
                ${currentPlan.pricing[workspace.billingInterval || 'monthly']}
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </div>
              {subscriptionData?.paymentMethod ? (
                <p className="text-lg font-semibold text-white capitalize">
                  {subscriptionData.paymentMethod.brand} •••• {subscriptionData.paymentMethod.last4}
                </p>
              ) : (
                <p className="text-slate-500">No card on file</p>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Warning */}
        {subscriptionData?.subscription?.cancelAtPeriodEnd && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Subscription ending</p>
              <p className="text-sm text-red-400/70">
                Your plan will be downgraded to Free on {formatDate(subscriptionData.subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>
        )}

        {/* Past Due Warning */}
        {subscriptionData?.subscription?.status === 'past_due' && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Payment past due</p>
              <p className="text-sm text-red-400/70">
                Please update your payment method to avoid service interruption.
              </p>
            </div>
            {canManageBilling && (
              <Button
                onClick={handleManageBilling}
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                Update Payment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Invoice History */}
      {subscriptionData?.invoices?.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-400" />
            Invoice History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {subscriptionData.invoices.map((invoice) => (
                  <tr key={invoice.id} className="text-sm">
                    <td className="py-3">
                      <span className="text-white font-medium">{invoice.number || 'Draft'}</span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {formatDate(invoice.created)}
                    </td>
                    <td className="py-3 text-white font-medium">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : invoice.status === 'open'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
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
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
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
        </div>
      )}

      {/* Interval Toggle */}
      {workspace.plan === 'free' && (
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
      )}

      {/* Plans Grid - Show only for free users or allow switching */}
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
                  : isCurrent
                  ? 'border-green-500/50 ring-1 ring-green-500/50'
                  : 'border-slate-700/50'
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isCurrent ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                  <Icon className={`w-5 h-5 ${isCurrent ? 'text-green-400' : 'text-indigo-400'}`} />
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
                    <><Check className="w-4 h-4 mr-2" /> Current Plan</>
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
            <p className="text-slate-300 font-medium">What happens if my subscription expires?</p>
            <p className="text-slate-400 mt-1">Premium features like Widget and Integrations will be disabled. You can renew anytime to restore access.</p>
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
