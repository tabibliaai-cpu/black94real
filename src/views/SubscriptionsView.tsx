'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { toast } from 'sonner'
import {
  PLANS,
  getCurrentPlan,
  FEATURE_COMPARISON,
  type Plan,
} from '@/lib/subscription'
import { startProTrial, startGoldTrial } from '@/lib/business'
import { updateAuthorDataInPosts } from '@/lib/db'

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CrownIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M5 18h14v2H5z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
      <path d="M12 17.5v.5M12 6v.5" />
    </svg>
  )
}

function ManageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CURRENT PLAN BANNER
   ═══════════════════════════════════════════════════════════════════════════ */

function CurrentPlanBanner() {
  const user = useAppStore((s) => s.user)
  const plan = getCurrentPlan(user?.subscription || 'free')

  const badgeColorMap: Record<string, string> = {
    free: 'bg-[#94a3b8]/20 text-[#94a3b8] border-[#94a3b8]/30',
    pro: 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30',
    gold: 'bg-[#ffd700]/15 text-[#ffd700] border-[#ffd700]/30',
  }

  const glowMap: Record<string, string> = {
    free: '',
    pro: 'shadow-[0_0_30px_rgba(29,155,240,0.08)]',
    gold: 'shadow-[0_0_30px_rgba(255,215,0,0.08)]',
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-[#000000] p-5',
        glowMap[plan.id]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {plan.id === 'gold' && <CrownIcon className="w-5 h-5 text-[#ffd700]" />}
          {plan.id === 'pro' && <StarIcon className="w-5 h-5 text-[#3b82f6]" />}
          {plan.id === 'free' && <LightningIcon className="w-5 h-5 text-[#94a3b8]" />}
          <span className="text-[15px] font-semibold text-[#e7e9ea]">Current Plan</span>
        </div>
        <span
          className={cn(
            'text-[13px] font-semibold px-3 py-1 rounded-full border',
            badgeColorMap[plan.id]
          )}
        >
          {plan.name}
        </span>
      </div>

      <p className="text-[13px] text-[#94a3b8] mb-4">
        Next billing: May 18, 2026
      </p>

      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[14px] font-medium text-[#e7e9ea] opacity-50 cursor-not-allowed"
      >
        <ManageIcon className="w-4 h-4" />
        Manage Subscription
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRICING CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function PricingCard({ plan, currentSubscription }: { plan: Plan; currentSubscription: string }) {
  const isCurrent = plan.id === currentSubscription
  const canUpgrade =
    (plan.id === 'pro' && currentSubscription === 'free') ||
    (plan.id === 'gold' && (currentSubscription === 'free' || currentSubscription === 'pro'))

  const borderColor: Record<string, string> = {
    free: 'border-white/[0.08]',
    pro: 'border-[#3b82f6]/30',
    gold: 'border-[#ffd700]/30',
  }

  const glowClass: Record<string, string> = {
    free: '',
    pro: 'shadow-[0_0_40px_rgba(29,155,240,0.1),0_0_80px_rgba(29,155,240,0.04)]',
    gold: 'shadow-[0_0_40px_rgba(255,215,0,0.1),0_0_80px_rgba(255,215,0,0.04)]',
  }

  const btnClass = isCurrent
    ? 'bg-white/[0.06] text-[#94a3b8] cursor-default'
    : plan.id === 'pro'
    ? 'bg-[#FFFFFF] text-black hover:bg-[#D1D5DB] active:scale-[0.97]'
    : plan.id === 'gold'
    ? 'bg-gradient-to-r from-[#ffd700] to-[#f0c800] text-black hover:from-[#f0c800] hover:to-[#e0b800] active:scale-[0.97]'
    : ''

  const [trialLoading, setTrialLoading] = useState(false)

  const handleStartTrial = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const currentUser = useAppStore.getState().user
    if (!currentUser?.id || isCurrent || trialLoading) return
    setTrialLoading(true)
    try {
      if (plan.id === 'pro') {
        await startProTrial(currentUser.id)
        const updatedUser = { ...currentUser, subscription: 'pro', badge: 'blue', isVerified: true, role: 'professional' }
        useAppStore.getState().setUser(updatedUser)
        // Batch-update all posts with new verification badge
        updateAuthorDataInPosts(currentUser.id, { authorIsVerified: true, authorBadge: 'blue' }).catch(() => {})
        toast.success('Pro trial activated! 7-day free trial started.')
      } else if (plan.id === 'gold') {
        await startGoldTrial(currentUser.id)
        const updatedUser = { ...currentUser, subscription: 'gold', badge: 'gold', isVerified: true, role: 'business' }
        useAppStore.getState().setUser(updatedUser)
        // Batch-update all posts with new verification badge
        updateAuthorDataInPosts(currentUser.id, { authorIsVerified: true, authorBadge: 'gold' }).catch(() => {})
        toast.success('Business trial activated! 7-day free trial started.')
      }
    } catch (err: any) {
      toast.error('Trial activation failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setTrialLoading(false)
    }
  }

  const handleUpgrade = () => {
    if (isCurrent) return
    toast.success(`Upgrade to ${plan.name} initiated!`)
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 w-[280px] rounded-2xl border bg-[#000000] p-5 transition-all duration-300 hover:scale-[1.02] hover:border-opacity-60',
        borderColor[plan.id],
        glowClass[plan.id],
        plan.popular && 'relative'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-[3px] rounded-full bg-[#3b82f6] text-[11px] font-bold text-white uppercase tracking-wider">
          Popular
        </div>
      )}

      {/* Plan icon */}
      <div className="mb-4">
        {plan.id === 'gold' && <CrownIcon className="w-8 h-8 text-[#ffd700]" />}
        {plan.id === 'pro' && <StarIcon className="w-8 h-8 text-[#3b82f6]" />}
        {plan.id === 'free' && <LightningIcon className="w-8 h-8 text-[#94a3b8]" />}
      </div>

      {/* Plan name & price */}
      <h3 className="text-[17px] font-bold text-[#e7e9ea] mb-1">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        {plan.price === 0 ? (
          <span className="text-[28px] font-bold text-[#e7e9ea]">Free</span>
        ) : (
          <>
            <span className="text-[28px] font-bold text-[#e7e9ea]">{plan.currency}{plan.price.toLocaleString()}</span>
            <span className="text-[13px] text-[#94a3b8]">/{plan.billingCycle}</span>
          </>
        )}
      </div>
      {plan.id === 'gold' && (
        <p className="text-[12px] text-[#64748b] mb-3">
          Affiliate badges: 2 free, extra ₹99 each
        </p>
      )}

      {/* CTA */}
      <div className="space-y-2">
        <button
          onClick={handleUpgrade}
          disabled={isCurrent || !canUpgrade || trialLoading}
          className={cn(
            'w-full py-2.5 rounded-full text-[14px] font-bold transition-all duration-200',
            btnClass,
            !isCurrent && !canUpgrade && 'bg-white/[0.04] text-[#64748b] cursor-not-allowed'
          )}
        >
          {isCurrent ? 'Current Plan' : canUpgrade ? 'Upgrade' : 'Unavailable'}
        </button>
        {!isCurrent && canUpgrade && plan.price > 0 && (
          <button
            onClick={handleStartTrial}
            disabled={trialLoading}
            className={cn(
              'w-full py-2 rounded-full text-[13px] font-semibold transition-all duration-200',
              'border border-white/[0.15] text-[#e7e9ea] hover:bg-white/[0.06] active:scale-[0.97]',
              trialLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {trialLoading ? 'Activating...' : `Start ${plan.id === 'pro' ? '7-day' : '7-day'} Free Trial`}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-white/[0.06]" />

      {/* Features list */}
      <ul className="space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', plan.id === 'gold' ? 'text-[#ffd700]' : plan.id === 'pro' ? 'text-[#3b82f6]' : 'text-[#94a3b8]')} />
            <span className="text-[13px] text-[#c0c0c0] leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE COMPARISON TABLE
   ═══════════════════════════════════════════════════════════════════════════ */

function FeatureComparisonTable() {
  const user = useAppStore((s) => s.user)
  const currentSub = user?.subscription || 'free'

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#000000] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-[17px] font-bold text-[#e7e9ea]">Feature Comparison</h3>
        <p className="text-[13px] text-[#94a3b8] mt-0.5">See what's included in each plan</p>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-[13px] font-semibold text-[#94a3b8] px-5 py-3">Feature</th>
              <th className="text-center text-[13px] font-semibold text-[#94a3b8] px-3 py-3 w-20">Free</th>
              <th className="text-center text-[13px] font-semibold text-[#3b82f6] px-3 py-3 w-20">Premium</th>
              <th className="text-center text-[13px] font-semibold text-[#ffd700] px-3 py-3 w-20">Business</th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_COMPARISON.map((row, i) => (
              <tr
                key={row.name}
                className={cn(
                  'border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]',
                  i % 2 === 0 && 'bg-white/[0.01]'
                )}
              >
                <td className="text-[13px] text-[#c0c0c0] px-5 py-3">{row.name}</td>
                <td className="text-center px-3 py-3">
                  <FeatureCell active={row.free} highlight={currentSub === 'free'} />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureCell active={row.pro} highlight={currentSub === 'pro'} accentColor="#3b82f6" />
                </td>
                <td className="text-center px-3 py-3">
                  <FeatureCell active={row.gold} highlight={currentSub === 'gold'} accentColor="#ffd700" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FeatureCell({
  active,
  highlight,
  accentColor,
}: {
  active: boolean
  highlight: boolean
  accentColor?: string
}) {
  return (
    <div className="flex items-center justify-center">
      {active ? (
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            highlight
              ? 'bg-[#FFFFFF]/15'
              : 'bg-white/[0.04]'
          )}
        >
          <CheckIcon
            className={cn(
              'w-3.5 h-3.5',
              highlight ? 'text-[#FFFFFF]' : accentColor ? '' : 'text-[#64748b]'
            )}
            style={highlight ? undefined : { stroke: accentColor || undefined }}
          />
        </div>
      ) : (
        <CrossIcon className="w-4 h-4 text-[#64748b]/50" />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   BILLING HISTORY
   ═══════════════════════════════════════════════════════════════════════════ */

function BillingHistory() {
  const user = useAppStore((s) => s.user)
  const sub = user?.subscription || 'free'

  if (sub === 'free') return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#000000] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
        <ReceiptIcon className="w-5 h-5 text-[#94a3b8]" />
        <div>
          <h3 className="text-[17px] font-bold text-[#e7e9ea]">Billing History</h3>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">Your recent invoices</p>
        </div>
      </div>

      <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🧾</span>
            </div>
            <p className="text-[15px] text-[#e7e9ea] font-medium">No billing history</p>
            <p className="text-[13px] text-[#94a3b8] mt-1">Invoices will appear here after your first payment</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUBSCRIPTIONS VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

export function SubscriptionsView() {
  const user = useAppStore((s) => s.user)
  const currentSubscription = user?.subscription || 'free'
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans')

  return (
    <div className="px-4 pt-2 pb-24 space-y-6">
      {/* A. Current Plan Banner */}
      <CurrentPlanBanner />

      {/* B. Pricing Cards */}
      <div>
        <h3 className="text-[17px] font-bold text-[#e7e9ea] mb-4">Choose your plan</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory custom-scrollbar">
          {PLANS.map((plan) => (
            <div key={plan.id} className="snap-start">
              <PricingCard plan={plan} currentSubscription={currentSubscription} />
            </div>
          ))}
        </div>
      </div>

      {/* C. Feature Comparison Table */}
      <FeatureComparisonTable />

      {/* D. Billing History */}
      {currentSubscription !== 'free' && <BillingHistory />}

      {/* Bottom spacers for tabs or billing */}
    </div>
  )
}
