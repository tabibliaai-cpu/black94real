'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import {
  mockAnalytics,
  monthlyRevenueData,
  leadSourceData,
  topProductsData,
  acquisitionTrend,
  formatCurrency,
  formatNumber,
} from '@/lib/crm'

const DATE_RANGES = ['7 days', '30 days', '90 days', 'This Year'] as const

const AI_RECOMMENDATIONS = [
  'Increase ad budget for 25-34 age group — they show 3.2x higher conversion than other segments.',
  'Consider launching a referral program — referred leads have 2.8x higher lifetime value.',
  'Your best performing product (Enterprise Setup) should be promoted more heavily in metro cities.',
  'Seasonal dips in March — consider offering early-bird discounts to maintain revenue momentum.',
]

export function CrmAnalyticsView() {
  const navigate = useAppStore((s) => s.navigate)
  const [dateRange, setDateRange] = useState<string>('30 days')

  // Filter data based on selected date range
  const filteredRevenueData = useMemo(() => {
    const monthsMap: Record<string, number> = { '7 days': 1, '30 days': 2, '90 days': 4, 'This Year': 6 }
    const count = monthsMap[dateRange] || 6
    return monthlyRevenueData.slice(-count)
  }, [dateRange])

  const filteredAcquisitionData = useMemo(() => {
    const monthsMap: Record<string, number> = { '7 days': 1, '30 days': 2, '90 days': 4, 'This Year': 6 }
    const count = monthsMap[dateRange] || 6
    return acquisitionTrend.slice(-count)
  }, [dateRange])

  const maxRevenue = Math.max(...filteredRevenueData.map(d => d.revenue))
  const maxCustomers = Math.max(...filteredAcquisitionData.map(d => d.customers))
  const maxProductRevenue = Math.max(...topProductsData.map(d => d.revenue))
  const totalSourceCount = leadSourceData.reduce((s, d) => s + d.count, 0)

  // Pie-chart-like visualization using conic-gradient
  let gradientSegments = ''
  let currentAngle = 0
  for (const source of leadSourceData) {
    const angle = (source.count / totalSourceCount) * 360
    gradientSegments += `${source.color} ${currentAngle}deg ${currentAngle + angle}deg, `
    currentAngle += angle
  }

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('business-dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/[0.06] transition-colors">
            <svg className="w-5 h-5 text-[#f0eef6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-xl font-bold text-[#f0eef6]">Analytics</h1>
        </div>
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="bg-[#110f1a] border border-white/[0.08] rounded-full px-3 py-1.5 text-[12px] text-[#f0eef6] outline-none appearance-none cursor-pointer"
        >
          {DATE_RANGES.map(r => <option key={r} value={r} className="bg-[#110f1a] text-[#f0eef6]">{r}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(mockAnalytics.totalRevenue), gradient: 'from-[#8b5cf6]/10 to-transparent', change: '+27.8%' },
          { label: 'Total Leads', value: String(mockAnalytics.totalLeads), gradient: 'from-blue-500/10 to-transparent', change: '+15%' },
          { label: 'Conversion Rate', value: `${mockAnalytics.conversionRate}%`, gradient: 'from-[#ffd700]/10 to-transparent', change: '+3.2%' },
          { label: 'Avg Deal Size', value: formatCurrency(mockAnalytics.avgDealSize), gradient: 'from-purple-500/10 to-transparent', change: '+8.1%' },
          { label: 'Customer LTV', value: formatCurrency(mockAnalytics.customerLifetimeValue), gradient: 'from-orange-500/10 to-transparent', change: '+12%' },
          { label: 'Active Customers', value: String(mockAnalytics.activeCustomers), gradient: 'from-cyan-500/10 to-transparent', change: '+5.4%' },
        ].map((kpi) => (
          <div key={kpi.label} className={cn('rounded-xl bg-gradient-to-br p-4 border border-white/[0.06]', kpi.gradient)}>
            <p className="text-[12px] text-[#94a3b8] font-medium">{kpi.label}</p>
            <p className="text-xl font-bold text-[#f0eef6] mt-1">{kpi.value}</p>
            <p className="text-[11px] text-[#8b5cf6] mt-0.5">{kpi.change} ↑</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl bg-[#110f1a] border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-[#f0eef6] mb-4">Monthly Revenue</h3>
        <div className="flex items-end gap-3 h-36">
          {filteredRevenueData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-[#94a3b8]">{formatCurrency(d.revenue)}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#8b5cf6]/30 to-[#8b5cf6] transition-all duration-500"
                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
              />
              <span className="text-[11px] text-[#94a3b8]">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Sources */}
      <div className="rounded-xl bg-[#110f1a] border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-[#f0eef6] mb-4">Lead Sources</h3>
        <div className="flex items-center gap-6">
          {/* Pie-like Chart */}
          <div
            className="w-28 h-28 rounded-full shrink-0"
            style={{
              background: `conic-gradient(${gradientSegments.slice(0, -2)})`,
            }}
          />
          {/* Legend */}
          <div className="flex-1 space-y-2">
            {leadSourceData.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: source.color }} />
                  <span className="text-[13px] text-[#f0eef6]">{source.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#f0eef6]">{source.count}</span>
                  <span className="text-[11px] text-[#64748b]">{((source.count / totalSourceCount) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl bg-[#110f1a] border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-[#f0eef6] mb-4">Top Products / Services</h3>
        <div className="space-y-3">
          {[...topProductsData].sort((a, b) => b.revenue - a.revenue).map((product, i) => (
            <div key={product.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold',
                    i === 0 ? 'bg-[#ffd700]/20 text-[#ffd700]' :
                    i === 1 ? 'bg-gray-400/20 text-gray-400' :
                    i === 2 ? 'bg-orange-400/20 text-orange-400' :
                    'bg-white/[0.06] text-[#94a3b8]'
                  )}>
                    {i + 1}
                  </span>
                  <span className="text-[13px] text-[#f0eef6] truncate">{product.name}</span>
                </div>
                <span className="text-[13px] font-bold text-[#8b5cf6]">{formatCurrency(product.revenue)}</span>
              </div>
              <div className="ml-8 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8b5cf6]/60 to-[#8b5cf6] rounded-full transition-all duration-700"
                  style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Acquisition Trend */}
      <div className="rounded-xl bg-[#110f1a] border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-[#f0eef6] mb-4">Customer Acquisition</h3>
        <div className="flex items-end gap-3 h-28">
          {filteredAcquisitionData.map((d, i) => {
            const height = (d.customers / maxCustomers) * 100
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 relative">
                <span className="text-[10px] text-[#94a3b8]">{d.customers}</span>
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-[#ffd700]/30 to-[#ffd700] transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[11px] text-[#94a3b8]">{d.month}</span>
                {/* Trend line dot */}
                {i < filteredAcquisitionData.length - 1 && (
                  <div
                    className="absolute rounded-full w-2 h-2 bg-[#ffd700]"
                    style={{ bottom: `${height}%`, left: '50%', transform: 'translateX(-50%)' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rounded-xl bg-gradient-to-br from-[#1a1a2a] to-[#110f1a] border border-purple-500/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-purple-300">AI Recommendations</h3>
        </div>
        <div className="space-y-3">
          {AI_RECOMMENDATIONS.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <p className="text-[13px] text-[#c0c0c0] leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
