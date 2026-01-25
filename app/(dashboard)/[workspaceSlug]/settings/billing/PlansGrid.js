import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PlansGrid({
  PLANS,
  workspace,
  interval,
  isLoading,
  canManageBilling,
  handleUpgrade,
}) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {['free', 'pro', 'business'].map((planKey) => {
        const plan = PLANS[planKey];
        const isCurrentPlan = workspace.plan === planKey;
        const price = plan.pricing[interval || 'monthly'];

        return (
          <div
            key={planKey}
            className={cn(
              "relative flex flex-col p-6 rounded-xl border transition-all duration-200",
              isCurrentPlan
                ? "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50 ring-1 ring-indigo-200 dark:ring-indigo-500/30"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-md"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-lg shadow-indigo-500/20">
                Most Popular
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    "p-2.5 rounded-lg",
                    isCurrentPlan
                      ? "bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  <plan.icon className="w-6 h-6" />
                </div>
                {isCurrentPlan && (
                  <span className="px-2 py-1 bg-white dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-100 dark:border-indigo-500/30">
                    Current
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{plan.name}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 min-h-[40px] leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">${price}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  /{interval === 'yearly' ? 'year' : 'mo'}
                </span>
              </div>
              {interval === 'yearly' && price > 0 && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 bg-emerald-50 dark:bg-emerald-500/10 inline-block px-1.5 py-0.5 rounded">
                  Billed ${price} yearly
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-3 text-sm",
                    feature.included ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  <Check
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      feature.included ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-300 dark:text-zinc-600"
                    )}
                  />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <Button
              className={cn(
                "w-full font-semibold shadow-sm",
                isCurrentPlan
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-default shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
              )}
              disabled={isCurrentPlan || !canManageBilling || isLoading}
              onClick={() => handleUpgrade(planKey)}
            >
              {isLoading === planKey ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isCurrentPlan
                ? 'Current Plan'
                : price === 0
                ? 'Downgrade'
                : 'Upgrade'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
