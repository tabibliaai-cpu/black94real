'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { upgradeToBusinessTrial, getBusinessTrial, type BusinessTrial } from '@/lib/business'
import { VerifiedBadge } from '@/components/PAvatar'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════════════════════
   REUSABLE MENU ROW — compact, thin border
   ═══════════════════════════════════════════════════════════════════════════ */

function MenuRow({
  icon,
  label,
  badge,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  badge?: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors',
        'hover:bg-white/[0.05] active:bg-white/[0.08]',
        danger && 'hover:bg-red-500/5'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-[18px] h-[18px] text-[#71767b]">{icon}</span>
        <span className={cn('text-[14px] font-medium', danger ? 'text-red-400' : 'text-[#e7e9ea]')}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full bg-white/[0.06] text-[#71767b]">{badge}</span>
        )}
        <svg className={cn('w-3.5 h-3.5', danger ? 'text-red-400/30' : 'text-[#536471]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER — compact
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ label }: { label: string }) {
  return <p className="text-[11px] font-bold text-[#536471] uppercase tracking-wider px-3 mb-0.5">{label}</p>
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM DASHBOARD VIEW — compact layout, no wasted space
   ═══════════════════════════════════════════════════════════════════════════ */

export function PremiumDashboardView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const logout = useAppStore((s) => s.logout)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const isDark = useAppStore((s) => s.isDarkMode)

  const [signingOut, setSigningOut] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [trial, setTrial] = useState<BusinessTrial | null>(null)

  const isBusiness = user?.role === 'business' || user?.accountType === 'business'
  const isPremium = user?.subscription === 'premium' || user?.subscription === 'business'

  useEffect(() => {
    if (!user?.id || !isBusiness) return
    getBusinessTrial(user.id).then((t) => setTrial(t)).catch(() => {})
  }, [user?.id, isBusiness])

  const handleUpgradeToBusiness = async () => {
    if (!user || isBusiness) return
    setUpgrading(true)
    try {
      await upgradeToBusinessTrial(user.id)
      useAppStore.getState().setUser({ ...user, role: 'business', accountType: 'business' as any })
      toast.success('Welcome to Business! You have a 30-day free trial.')
      const t = await getBusinessTrial(user.id)
      setTrial(t)
    } catch (e: any) {
      toast.error('Upgrade failed: ' + e.message)
    } finally {
      setUpgrading(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const { signOutUser } = await import('@/lib/firebase')
      await signOutUser()
      logout()
    } catch {
      toast.error('Sign out failed')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 pt-4 pb-24">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => navigate('feed')} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.07] transition-colors">
          <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-lg font-bold text-white">Dashboard</h1>
      </div>

      {/* ─── Profile Card ─── */}
      <div className="rounded-2xl border border-white/[0.08] p-4 mb-3">
        <div className="flex items-center gap-3">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.displayName || 'User'} className="w-12 h-12 rounded-full object-cover ring-1 ring-white/[0.15]" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/[0.08] flex items-center justify-center text-white font-bold text-lg">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-white inline-flex items-center gap-1.5">
              {user?.displayName || 'User'}
              {(user?.isVerified || !!user?.badge) && <VerifiedBadge size={14} badge={user?.badge} />}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                isPremium ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-[#71767b]'
              )}>
                {isPremium ? (isBusiness ? 'Business' : 'Premium') : 'Free Plan'}
              </span>
              <span className="text-[12px] text-[#71767b]">@{user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Upgrade Card ─── */}
      {!isBusiness && (
        <div className="rounded-2xl border border-white/[0.12] p-4 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-[18px] h-[18px] text-[#e7e9ea] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <div>
              <p className="text-[14px] font-bold text-white">Upgrade to Business</p>
              <p className="text-[12px] text-[#71767b]">Store, products & commerce</p>
            </div>
          </div>
          <p className="text-[12px] text-[#71767b] mb-3">
            Enable your store, sell products, manage orders. Start with a <span className="text-[#e7e9ea] font-semibold">30-day free trial</span>.
          </p>
          <button
            onClick={handleUpgradeToBusiness}
            disabled={upgrading}
            className="w-full py-2.5 rounded-full bg-white text-black font-bold text-[14px] active:scale-[0.97] transition-all disabled:opacity-50 hover:bg-white/90"
          >
            {upgrading ? 'Upgrading...' : 'Start Free Trial'}
          </button>
        </div>
      )}

      {/* ─── Business Active Card ─── */}
      {isBusiness && (
        <div className="space-y-2 mb-3">
          <div className="rounded-2xl border border-white/[0.08] p-4 flex items-center gap-3">
            <svg className="w-[18px] h-[18px] text-[#e7e9ea] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-white">Business Account</p>
              <p className="text-[12px] text-[#71767b]">Store & commerce enabled</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00ba7c]/15 text-[#00ba7c]">Active</span>
          </div>
          {trial && (
            <div className={cn('p-3 rounded-xl border', trial.isActive ? (trial.daysRemaining <= 7 ? 'border-amber-500/20' : 'border-white/[0.06]') : 'border-red-500/20')}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[12px] font-bold text-white">Free Trial</p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', trial.isActive ? (trial.daysRemaining <= 7 ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.06] text-[#71767b]') : 'bg-red-500/15 text-red-400')}>
                  {trial.isActive ? `${trial.daysRemaining}d left` : 'Expired'}
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1 mb-1.5">
                <div className={cn('h-1 rounded-full transition-all', trial.isActive ? (trial.daysRemaining <= 7 ? 'bg-amber-400' : 'bg-white/20') : 'bg-red-400')} style={{ width: `${Math.max(2, (trial.daysRemaining / 30) * 100)}%` }} />
              </div>
              <p className="text-[11px] text-[#71767b]">
                {trial.isActive
                  ? trial.daysRemaining <= 7
                    ? `Trial ends in ${trial.daysRemaining} day${trial.daysRemaining !== 1 ? 's' : ''}. Subscribe to continue.`
                    : `${trial.daysRemaining} days remaining`
                  : 'Your free trial has ended. Subscribe to continue.'}
              </p>
              {!trial.isActive && (
                <button className="w-full mt-2 py-2 rounded-full bg-white text-black font-bold text-[12px] active:scale-[0.98] transition-all">
                  Subscribe Now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Settings Sections — compact ─── */}
      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="Messaging & Privacy" />
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
          label="Privacy Settings"
          badge="Nuclear Block"
          onClick={() => navigate('privacy-settings')}
        />
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
          label="Share Profile"
          badge="Expiring Link"
          onClick={() => navigate('share-profile')}
        />
      </div>

      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="Content" />
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
          label="Write Article"
          onClick={() => navigate('write-article')}
        />
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          label="My Articles"
          onClick={() => navigate('article')}
        />
      </div>

      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="Monetization" />
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
          label="Subscriptions"
          badge={user?.subscription === 'premium' ? 'Pro' : user?.subscription === 'business' ? 'Gold' : 'Free'}
          onClick={() => navigate('subscriptions')}
        />
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}
          label="Affiliates"
          badge="Earn"
          onClick={() => navigate('affiliates')}
        />
      </div>

      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="Store & Commerce" />
        {isBusiness && (
          <>
            <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} label="Store Dashboard" badge="Manage" onClick={() => navigate('store-dashboard')} />
            <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>} label="My Store" onClick={() => navigate('my-store')} />
            <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Business Orders" onClick={() => navigate('business-orders')} />
          </>
        )}
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="My Orders" onClick={() => navigate('order-tracking')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>} label="Cart" onClick={() => navigate('cart')} />
      </div>

      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="Business & Advertising" />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>} label="Business Dashboard" onClick={() => navigate('business-dashboard')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} label="Ad Manager" onClick={() => navigate('ads-manager')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>} label="Create Ad" onClick={() => navigate('create-ad')} />
      </div>

      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="AI CRM" />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>} label="Leads" onClick={() => navigate('crm-leads')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} label="Deals" onClick={() => navigate('crm-deals')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Orders" onClick={() => navigate('crm-orders')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>} label="Analytics" onClick={() => navigate('crm-analytics')} />
      </div>

      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="Team" />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} label="Salary" onClick={() => navigate('salary')} />
        <MenuRow icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} label="Performance" onClick={() => navigate('performance')} />
      </div>

      {/* ─── App Settings ─── */}
      <div className="border-t border-white/[0.06] pt-2.5 pb-1 space-y-0.5">
        <SectionHeader label="App" />
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-[18px] h-[18px] text-[#71767b]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            </span>
            <span className="text-[14px] font-medium text-[#e7e9ea]">Dark mode</span>
          </div>
          <div className={cn('w-10 h-[26px] rounded-full transition-colors relative', isDark ? 'bg-white' : 'bg-white/[0.15]')}>
            <div className={cn('w-[20px] h-[20px] rounded-full bg-black absolute top-[3px] transition-all', isDark ? 'left-[21px]' : 'left-[3px]')} />
          </div>
        </button>
        <MenuRow
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          label="Edit Profile"
          onClick={() => navigate('edit-profile')}
        />
      </div>

      {/* ─── Sign Out ─── */}
      <div className="border-t border-white/[0.06] pt-3 pb-4">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-2.5 rounded-full border border-white/[0.15] text-[#e7e9ea] text-[14px] font-medium hover:bg-white/[0.05] transition-colors active:scale-[0.98]"
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
