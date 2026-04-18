'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  mockAdCampaigns,
  dailyImpressionsData,
  recentActivity,
  getAdStatusColor,
  formatCurrency,
  formatNumber,
  type AdCampaign,
} from '@/lib/crm'

function loadCampaigns(): AdCampaign[] {
  if (typeof window === 'undefined') return mockAdCampaigns
  const stored = localStorage.getItem('black94_ads')
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fall through */ }
  }
  return mockAdCampaigns
}

export function AdsManagerView() {
  const navigate = useAppStore((s) => s.navigate)
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(loadCampaigns)

  const allCampaigns = [...campaigns, ...mockAdCampaigns.filter(m => !campaigns.find(c => c.id === m.id))]
  const totalImpressions = allCampaigns.reduce((s, c) => s + c.impressions, 0)
  const totalClicks = allCampaigns.reduce((s, c) => s + c.clicks, 0)
  const totalSpend = allCampaigns.reduce((s, c) => s + c.spend, 0)
  const totalConversions = allCampaigns.reduce((s, c) => s + (c.conversions || 0), 0)
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const next = c.status === 'Active' ? 'Paused' : c.status === 'Paused' ? 'Active' : c.status
        toast.success(`Campaign ${next.toLowerCase()}`)
        return { ...c, status: next as AdCampaign['status'] }
      }
      return c
    }))
  }

  const maxImpressions = Math.max(...dailyImpressionsData.map(d => d.impressions))

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('business-dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/[0.06] transition-colors">
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-[#e8f0dc]">Ad Manager</h1>
        <button
          onClick={() => navigate('create-ad')}
          className="px-3 py-1.5 rounded-full bg-[#a3d977] text-black text-[13px] font-bold hover:bg-[#8cc65e] transition-colors"
        >
          + Create Ad
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Impressions', value: formatNumber(totalImpressions), icon: '👁', gradient: 'from-[#a3d977]/10 to-transparent', trend: '+12.5%' },
          { label: 'Total Clicks', value: formatNumber(totalClicks), icon: '👆', gradient: 'from-[#ffd700]/10 to-transparent', sub: `CTR ${overallCTR}%` },
          { label: 'Total Spend', value: formatCurrency(totalSpend), icon: '💰', gradient: 'from-orange-500/10 to-transparent' },
          { label: 'Conversions', value: formatNumber(totalConversions), icon: '🎯', gradient: 'from-purple-500/10 to-transparent' },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl bg-gradient-to-br p-4 border border-white/[0.06]', stat.gradient)}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-[12px] text-[#71767b] font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-[#e8f0dc]">{stat.value}</p>
            {(stat.trend || stat.sub) && (
              <p className="text-[12px] text-[#a3d977] mt-1">{stat.trend || stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-[#e8f0dc] mb-4">Impressions — Last 7 Days</h3>
        <div className="flex items-end gap-2 h-32">
          {dailyImpressionsData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-[#71767b]">{formatNumber(d.impressions)}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#a3d977]/40 to-[#a3d977] transition-all duration-500"
                style={{ height: `${(d.impressions / maxImpressions) * 100}%` }}
              />
              <span className="text-[11px] text-[#71767b]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Campaigns */}
      <div>
        <h3 className="text-sm font-semibold text-[#e8f0dc] mb-3">Campaigns</h3>
        <div className="space-y-3">
          {allCampaigns.map((campaign) => {
            const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0'
            return (
              <div key={campaign.id} className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#e8f0dc]">{campaign.name}</h4>
                    <p className="text-[12px] text-[#71767b] mt-0.5 truncate max-w-[200px]">{campaign.headline}</p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0', getAdStatusColor(campaign.status))}>
                    {campaign.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div>
                    <p className="text-[11px] text-[#71767b]">Impressions</p>
                    <p className="text-[13px] font-semibold text-[#e8f0dc]">{formatNumber(campaign.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#71767b]">Clicks</p>
                    <p className="text-[13px] font-semibold text-[#e8f0dc]">{formatNumber(campaign.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#71767b]">CTR</p>
                    <p className="text-[13px] font-semibold text-[#ffd700]">{ctr}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#71767b]">Spend</p>
                    <p className="text-[13px] font-semibold text-[#e8f0dc]">{formatCurrency(campaign.spend)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {campaign.status !== 'Ended' && (
                    <button
                      onClick={() => toggleStatus(campaign.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors',
                        campaign.status === 'Active'
                          ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
                          : 'bg-[#a3d977]/15 text-[#a3d977] hover:bg-[#a3d977]/25'
                      )}
                    >
                      {campaign.status === 'Active' ? 'Pause' : 'Resume'}
                    </button>
                  )}
                  <button
                    onClick={() => toast.info('Edit feature coming soon')}
                    className="px-3 py-1 rounded-full text-[12px] font-semibold bg-white/[0.06] text-[#e8f0dc] hover:bg-white/[0.1] transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-[#e8f0dc] mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn(
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                activity.type === 'success' ? 'bg-[#a3d977]' :
                activity.type === 'warning' ? 'bg-yellow-400' :
                activity.type === 'info' ? 'bg-blue-400' : 'bg-[#71767b]'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#e8f0dc]">{activity.text}</p>
                <p className="text-[11px] text-[#71767b]">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
