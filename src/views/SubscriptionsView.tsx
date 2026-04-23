'use client'

import { useAppStore } from '@/stores/app'

const ALL_FEATURES = [
  'Post creation (up to 4000 characters)',
  'Chat messaging with E2E encryption',
  'Stories (text, voice, poll, festival, cricket)',
  'Search & Explore',
  'Blue verification badge (all accounts)',
  'Gold verification badge (business accounts)',
  'Paid chat functionality',
  'Article creation',
  'Privacy controls',
  'Profile customization',
  'Business dashboard & tools',
  'CRM & ad management',
  'AI-powered tools',
  'Affiliate badges',
  'Store & commerce',
  'Order tracking',
]

export function SubscriptionsView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('settings')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-5 h-5 text-[#e7e9ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#e7e9ea]">Free Forever</h1>
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] border border-white/[0.08] p-6 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Black94 is Free</h2>
          <p className="text-[15px] text-white/60 leading-relaxed">
            Every feature on Black94 is completely free. No subscriptions, no hidden fees, no premium tiers. All users get full access to everything.
          </p>
        </div>

        {/* Verification badges info */}
        <div className="rounded-2xl bg-black border border-white/[0.08] p-4 mb-6">
          <h3 className="text-[15px] font-semibold text-white mb-3">Verification Badges</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">Blue Badge</p>
                <p className="text-[12px] text-white/40">Given to all verified personal accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffd700]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#ffd700]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">Gold Badge</p>
                <p className="text-[12px] text-white/40">Given to business accounts with full business tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* All features list */}
        <div className="rounded-2xl bg-black border border-white/[0.08] p-4">
          <h3 className="text-[15px] font-semibold text-white mb-3">All Features Included</h3>
          <div className="grid grid-cols-1 gap-2">
            {ALL_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 py-1">
                <svg className="w-4 h-4 text-[#10b981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[14px] text-white/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
