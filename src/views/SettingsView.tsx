'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { updateUser } from '@/lib/db'
import { PAvatar } from '@/components/PAvatar'
import { toast } from 'sonner'
import { upgradeToBusinessTrial, getBusinessTrial, type BusinessTrial } from '@/lib/business'

/* ═══════════════════════════════════════════════════════════════════════════
   REUSABLE MENU ROW
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
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', danger ? 'bg-red-500/10' : 'bg-white/[0.06]')}>
          {icon}
        </span>
        <span className={cn('text-[15px]', danger ? 'text-red-400' : 'text-[#e8f0dc]')}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-[2px] rounded-full bg-[#a3d977]/15 text-[#a3d977]">{badge}</span>
        )}
        <svg className={cn('w-4 h-4', danger ? 'text-red-400/40' : 'text-[#71767b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ label }: { label: string }) {
  return <p className="text-[12px] font-semibold text-[#536471] uppercase tracking-wider px-4 mb-1">{label}</p>
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const navigate = useAppStore((s) => s.navigate)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const isDark = useAppStore((s) => s.isDarkMode)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [trial, setTrial] = useState<BusinessTrial | null>(null)

  const isBusiness = user?.role === 'business' || user?.accountType === 'business'

  // Fetch trial status for business accounts
  useEffect(() => {
    if (!user?.id || !isBusiness) return
    getBusinessTrial(user.id).then((t) => setTrial(t)).catch(() => {})
  }, [user?.id, isBusiness])

  const handleUpgradeToBusiness = async () => {
    if (!user || isBusiness) return
    setUpgrading(true)
    try {
      await upgradeToBusinessTrial(user.id)
      // Update local store
      useAppStore.getState().setUser({
        ...user,
        role: 'business',
        accountType: 'business' as any,
 })
      toast.success('Welcome to Business! You have a 30-day free trial.')
      // Fetch trial data
      const t = await getBusinessTrial(user.id)
      setTrial(t)
    } catch (e: any) {
      toast.error('Upgrade failed: ' + e.message)
    } finally {
      setUpgrading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateUser(user.id, { displayName, bio })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
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
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* ─── Profile Section ─── */}
      <div>
        <h3 className="text-xl font-bold text-[#e8f0dc] mb-4">Edit profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <PAvatar src={user?.profileImage} name={user?.displayName} size={64} verified={user?.isVerified} />
          <div>
            <p className="font-bold text-[15px] text-[#e8f0dc]">{user?.displayName}</p>
            <p className="text-[14px] text-[#71767b]">@{user?.username}</p>
          </div>
        </div>
        <div className="space-y-1.5 mb-4">
          <label className="text-[14px] text-[#71767b]">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-2.5 text-[15px] text-[#e8f0dc] placeholder-[#536471] outline-none focus:border-[#a3d977]/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5 mb-4">
          <label className="text-[14px] text-[#71767b]">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full bg-transparent border border-white/[0.08] rounded-lg px-4 py-2.5 text-[15px] text-[#e8f0dc] placeholder-[#536471] outline-none focus:border-[#a3d977]/50 transition-colors resize-none"
          />
          <p className="text-[13px] text-[#71767b] text-right">{bio.length}/160</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full py-2.5 rounded-full text-[15px] font-bold transition-colors',
            !saving ? 'bg-[#e8f0dc] text-black hover:bg-gray-200' : 'bg-white/[0.08] text-[#536471]'
          )}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* ─── Messaging & Privacy ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Messaging & Privacy" />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-[#a3d977]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
          label="Privacy Settings"
          badge="Nuclear Block"
          onClick={() => navigate('privacy-settings')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
          label="Share Profile"
          badge="Expiring Link"
          onClick={() => navigate('share-profile')}
        />
      </div>

      {/* ─── Content Creation ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Content" />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
          label="Write Article"
          onClick={() => navigate('write-article')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
          label="My Articles"
          onClick={() => navigate('article')}
        />
      </div>

      {/* ─── Subscriptions & Monetization ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Monetization" />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
          label="Subscriptions"
          badge={user?.subscription === 'premium' ? 'Pro' : user?.subscription === 'business' ? 'Gold' : 'Free'}
          onClick={() => navigate('subscriptions')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}
          label="Affiliates"
          badge="Earn"
          onClick={() => navigate('affiliates')}
        />
      </div>

      {/* ─── Store & Commerce ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Store & Commerce" />
        {isBusiness && (
          <>
            <MenuRow
              icon={<svg className="w-[18px] h-[18px] text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              label="Store Dashboard"
              badge="Manage"
              onClick={() => navigate('store-dashboard')}
            />
            <MenuRow
              icon={<svg className="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
              label="My Store"
              onClick={() => navigate('my-store')}
            />
            <MenuRow
              icon={<svg className="w-[18px] h-[18px] text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
              label="Business Orders"
              onClick={() => navigate('business-orders')}
            />
          </>
        )}
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          label="My Orders"
          onClick={() => navigate('order-tracking')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}
          label="Cart"
          onClick={() => navigate('cart')}
        />
      </div>

      {/* ─── Business & Advertising ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Business & Advertising" />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
          label="Business Dashboard"
          onClick={() => navigate('business-dashboard')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="Ad Manager"
          onClick={() => navigate('ads-manager')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
          label="Create Ad"
          onClick={() => navigate('create-ad')}
        />
      </div>

      {/* ─── CRM ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="AI CRM" />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          label="Leads"
          onClick={() => navigate('crm-leads')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Deals"
          onClick={() => navigate('crm-deals')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          label="Orders"
          onClick={() => navigate('crm-orders')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
          label="Analytics"
          onClick={() => navigate('crm-analytics')}
        />
      </div>

      {/* ─── Team Management ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Team" />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          label="Salary"
          onClick={() => navigate('salary')}
        />
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          label="Performance"
          onClick={() => navigate('performance')}
        />
      </div>

      {/* ─── Account Type ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="Account Type" />
        {isBusiness ? (
          <div className="space-y-2">
            <div className="px-4 py-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#a3d977]/10">
                <svg className="w-[18px] h-[18px] text-[#a3d977]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-[#a3d977]">Business Account</p>
                <p className="text-[12px] text-[#71767b]">Store, products & commerce enabled</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#a3d977]/15 text-[#a3d977]">Active</span>
            </div>
            {trial && (
              <div className={cn(
                'mx-4 p-3.5 rounded-xl border',
                trial.isActive
                  ? trial.daysRemaining <= 7
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-[#a3d977]/5 border-[#a3d977]/15'
                  : 'bg-red-500/5 border-red-500/20'
              )}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <svg className={cn('w-4 h-4', trial.isActive ? (trial.daysRemaining <= 7 ? 'text-amber-400' : 'text-[#a3d977]') : 'text-red-400')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <p className="text-[13px] font-semibold text-[#e8f0dc]">Free Trial</p>
                  </div>
                  <span className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full',
                    trial.isActive
                      ? trial.daysRemaining <= 7
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-[#a3d977]/15 text-[#a3d977]'
                      : 'bg-red-500/15 text-red-400'
                  )}>
                    {trial.isActive ? `${trial.daysRemaining}d left` : 'Expired'}
                  </span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-1.5">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      trial.isActive
                        ? trial.daysRemaining <= 7 ? 'bg-amber-400' : 'bg-[#a3d977]'
                        : 'bg-red-400'
                    )}
                    style={{ width: `${Math.max(2, (trial.daysRemaining / 30) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#536471]">
                  {trial.isActive
                    ? trial.daysRemaining <= 7
                      ? `Trial ends in ${trial.daysRemaining} day${trial.daysRemaining !== 1 ? 's' : ''}. Subscribe to continue.`
                      : `Started ${new Date(trial.startDate).toLocaleDateString()} — ${trial.daysRemaining} days remaining`
                    : 'Your free trial has ended. Subscribe to continue using business features.'}
                </p>
                {!trial.isActive && (
                  <button className="w-full mt-2.5 py-2 rounded-full bg-gradient-to-r from-[#a3d977] to-[#8cc65e] text-black font-bold text-[13px] active:scale-[0.98] transition-all">
                    Subscribe Now
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-4 mb-2 p-4 rounded-xl bg-gradient-to-br from-[#a3d977]/10 via-transparent to-amber-500/5 border border-[#a3d977]/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#a3d977]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <p className="text-[15px] font-bold text-[#e8f0dc]">Upgrade to Business</p>
            </div>
            <p className="text-[13px] text-[#71767b] mb-3">Enable your store, sell products, manage orders & shipping partners. Start with a <span className="text-[#a3d977] font-semibold">30-day free trial</span>.</p>
            <button
              onClick={handleUpgradeToBusiness}
              disabled={upgrading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#a3d977] to-[#8cc65e] text-black font-bold text-[14px] shadow-lg shadow-[#a3d977]/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {upgrading ? 'Upgrading...' : 'Start Free Trial'}
            </button>
          </div>
        )}
      </div>

      {/* ─── App Settings ─── */}
      <div className="border-t border-white/[0.06] pt-4 space-y-1">
        <SectionHeader label="App" />
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06]">
              <svg className="w-[18px] h-[18px] text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            </span>
            <span className="text-[15px] text-[#e8f0dc]">Dark mode</span>
          </div>
          <div className={cn('w-11 h-6 rounded-full transition-colors relative', isDark ? 'bg-[#a3d977]' : 'bg-white/[0.15]')}>
            <div className={cn('w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform', isDark ? 'translate-x-[22px]' : 'translate-x-0.5')} />
          </div>
        </button>
        <MenuRow
          icon={<svg className="w-[18px] h-[18px] text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          label="Account"
          onClick={() => navigate('profile')}
        />
      </div>

      {/* ─── Sign Out ─── */}
      <div className="border-t border-white/[0.06] pt-4">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-2.5 rounded-full border border-red-500/30 text-red-500 text-[15px] font-bold hover:bg-red-500/10 transition-colors"
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
