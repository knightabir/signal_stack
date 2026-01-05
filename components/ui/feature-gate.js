'use client';

import { useRouter } from 'next/navigation';
import { Lock, Crown, Zap } from 'lucide-react';

/**
 * Upgrade Badge Component
 * Shows "Premium" or "Upgrade to Business" badges
 */
export function UpgradeBadge({ badge, workspaceSlug, size = 'sm', className = '' }) {
  const router = useRouter();

  if (!badge) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/${workspaceSlug}/settings/billing`);
  };

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  const isPremium = badge.plan === 'pro';

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        transition-all cursor-pointer hover:scale-105
        ${isPremium
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30'
          : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 hover:from-purple-500/30 hover:to-indigo-500/30'
        }
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {isPremium ? <Zap className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
      {badge.text}
    </button>
  );
}

/**
 * Feature Gate Component
 * Wraps features that may be locked based on plan
 */
export function FeatureGate({
  children,
  featureAccess,
  workspaceSlug,
  showBadge = true,
  overlay = true,
  disabled = false,
}) {
  const router = useRouter();

  if (!featureAccess || featureAccess.hasAccess) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    router.push(`/${workspaceSlug}/settings/billing`);
  };

  return (
    <div className="relative">
      {/* Wrapped content with reduced opacity */}
      <div className={`${overlay ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {children}
      </div>

      {/* Overlay with upgrade prompt */}
      {overlay && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-900/30 rounded-lg cursor-pointer group"
          onClick={handleUpgradeClick}
        >
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/90 rounded-xl border border-slate-700 shadow-xl transition-transform group-hover:scale-105">
            <Lock className="w-5 h-5 text-slate-400" />
            {showBadge && featureAccess.upgradeBadge && (
              <UpgradeBadge
                badge={featureAccess.upgradeBadge}
                workspaceSlug={workspaceSlug}
                size="md"
              />
            )}
            <p className="text-xs text-slate-400 text-center">
              Click to upgrade
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Locked Button Component
 * A button that is visible but disabled with upgrade badge
 */
export function LockedButton({
  children,
  featureAccess,
  workspaceSlug,
  onClick,
  className = '',
  ...props
}) {
  const router = useRouter();

  const isLocked = featureAccess?.isLocked;

  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      router.push(`/${workspaceSlug}/settings/billing`);
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative inline-flex items-center gap-2
        ${isLocked ? 'opacity-75 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
      {isLocked && featureAccess.upgradeBadge && (
        <UpgradeBadge
          badge={featureAccess.upgradeBadge}
          workspaceSlug={workspaceSlug}
          size="xs"
        />
      )}
    </button>
  );
}

/**
 * Feature Card with Lock Indicator
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  featureAccess,
  workspaceSlug,
  onClick,
  children,
}) {
  const router = useRouter();
  const isLocked = featureAccess?.isLocked;

  const handleClick = () => {
    if (isLocked) {
      router.push(`/${workspaceSlug}/settings/billing`);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-xl border transition-all
        ${isLocked
          ? 'bg-slate-800/30 border-slate-700/50 cursor-pointer hover:border-indigo-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isLocked ? 'bg-slate-700/50' : 'bg-slate-700'}`}>
          {Icon && <Icon className={`w-5 h-5 ${isLocked ? 'text-slate-500' : 'text-indigo-400'}`} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-medium ${isLocked ? 'text-slate-400' : 'text-white'}`}>
              {title}
            </h3>
            {isLocked && featureAccess.upgradeBadge && (
              <UpgradeBadge
                badge={featureAccess.upgradeBadge}
                workspaceSlug={workspaceSlug}
              />
            )}
          </div>
          <p className={`text-sm mt-1 ${isLocked ? 'text-slate-500' : 'text-slate-400'}`}>
            {description}
          </p>
        </div>
        {isLocked && (
          <Lock className="w-4 h-4 text-slate-500" />
        )}
      </div>
      {children && !isLocked && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Usage Limit Bar
 * Shows current usage vs plan limit
 */
export function UsageLimitBar({ current, limit, label, workspaceSlug }) {
  const router = useRouter();
  const percentage = limit === Infinity ? 0 : Math.min(100, (current / limit) * 100);
  const isUnlimited = limit === Infinity;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-slate-300'}`}>
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isAtLimit && (
        <button
          onClick={() => router.push(`/${workspaceSlug}/settings/billing`)}
          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
        >
          Upgrade for more →
        </button>
      )}
    </div>
  );
}
