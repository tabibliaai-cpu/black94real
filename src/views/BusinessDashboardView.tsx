'use client'

import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import {
  mockAnalytics,
  monthlyRevenueData,
  mockLeads,
  formatCurrency,
  formatNumber,
} from '@/lib/crm'

const QUICK_ACTIONS = [
  { label: 'Manage Ads', view: 'ads-manager' as const, icon: '📢', color: 'from-[#a3d977]/10 to-transparent' },
  { label: 'View Leads', view: 'crm-leads' as const, icon: '👥', color: 'from-blue-500/10 to-transparent' },
  { label: 'Affiliate Badges', view: 'affiliates' as const, icon: '🏆', color: 'from-[#ffd700]/10 to-transparent' },
  { label: 'Create Campaign', view: 'create-ad' as const, icon: '🚀', color: 'from-purple-500/10 to-transparent' },
]

const AI_INSIGHTS = [
  'Your conversion rate improved 12% this week. Consider increasing ad spend on the 25-34 age group.',
  'Lead quality from referral sources is 2.3x higher than ads. Consider a referral rewards program.',
  'Revenue from enterprise deals grew 28% month-over-month. Prioritize closing the pending proposals.',
]

export function BusinessDashboardView() {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const username = user?.displayName || user?.username || 'User'

  const recentLeads = mockLeads.slice(0, 3)
  const maxRevenue = Math.max(...monthlyRevenueData.map(d => d.revenue))

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('feed')} className="p-2 -ml-2 rounded-full hover:bg-white/[0.06] transition-colors">
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-[#e8f0dc]">Business Dashboard</h1>
      </div>

      {/* Greeting */}
      <div className="rounded-xl bg-gradient-to-br from-[#a3d977]/10 via-[#0a0a0a] to-[#ffd700]/5 border border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#a3d977] to-[#8cc65e] flex items-center justify-center text-black font-bold text-lg">
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-[17px] font-bold text-[#e8f0dc]">Welcome back, {username}!</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[#ffd700]/15 text-[#ffd700]">
                {user?.accountType === 'business' ? 'Business Account' : 'Pro Account'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(mockAnalytics.totalRevenue), icon: '💵', gradient: 'from-[#a3d977]/10 to-transparent' },
          { label: 'Active Leads', value: String(mockAnalytics.totalLeads), icon: '🎯', gradient: 'from-blue-500/10 to-transparent' },
          { label: 'Conversion Rate', value: `${mockAnalytics.conversionRate}%`, icon: '📈', gradient: 'from-[#ffd700]/10 to-transparent' },
          { label: 'Satisfaction', value: '4.7/5', icon: '⭐', gradient: 'from-orange-500/10 to-transparent' },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl bg-gradient-to-br p-4 border border-white/[0.06]', stat.gradient)}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-[12px] text-[#71767b] font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-[#e8f0dc]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#e8f0dc]">Revenue Trend</h3>
          <span className="text-[11px] text-[#a3d977] font-semibold">+27.8% ↑</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {monthlyRevenueData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-[#71767b]">{formatCurrency(d.revenue)}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#a3d977]/30 to-[#a3d977] transition-all duration-500"
                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
              />
              <span className="text-[11px] text-[#71767b]">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-[#e8f0dc] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.view)}
              className={cn(
                'rounded-xl bg-gradient-to-br border border-white/[0.06] p-4 text-left transition-all active:scale-[0.97]',
                action.color
              )}
            >
              <span className="text-2xl">{action.icon}</span>
              <p className="text-[14px] font-semibold text-[#e8f0dc] mt-2">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#e8f0dc]">Recent Leads</h3>
          <button onClick={() => navigate('crm-leads')} className="text-[12px] text-[#a3d977] font-semibold">View all</button>
        </div>
        <div className="space-y-3">
          {recentLeads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a2a1a] to-[#0a0a0a] flex items-center justify-center text-[13px] text-[#a3d977] font-bold shrink-0">
                {lead.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#e8f0dc] truncate">{lead.name}</p>
                <p className="text-[12px] text-[#71767b]">{lead.status} • {lead.createdAt}</p>
              </div>
              <div className={cn(
                'text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0',
                lead.aiScore > 80 ? 'bg-[#a3d977]/15 text-[#a3d977]' :
                lead.aiScore >= 50 ? 'bg-[#ffd700]/15 text-[#ffd700]' :
                'bg-red-500/15 text-red-400'
              )}>
                {lead.aiScore}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-xl bg-gradient-to-br from-[#1a1a2a] to-[#0a0a0a] border border-purple-500/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-purple-300">AI Insights</h3>
        </div>
        <div className="space-y-3">
          {AI_INSIGHTS.map((insight, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <p className="text-[13px] text-[#c0c0c0] leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
