'use client'

import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import { mockOrders, getOrderStatusColor, formatCurrency } from '@/lib/crm'

const STATUS_ICONS: Record<string, string> = {
  Pending: '⏳',
  Processing: '⚙️',
  Shipped: '🚚',
  Delivered: '✅',
  Cancelled: '❌',
}

export function CrmOrdersView() {
  const navigate = useAppStore((s) => s.navigate)

  const totalOrders = mockOrders.length
  const pending = mockOrders.filter(o => o.status === 'Pending').length
  const shipped = mockOrders.filter(o => o.status === 'Shipped').length
  const delivered = mockOrders.filter(o => o.status === 'Delivered').length

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('business-dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/[0.06] transition-colors">
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-[#e8f0dc]">Orders</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: totalOrders, color: 'text-[#e8f0dc]' },
          { label: 'Pending', value: pending, color: 'text-yellow-400' },
          { label: 'Shipped', value: shipped, color: 'text-purple-400' },
          { label: 'Delivered', value: delivered, color: 'text-[#a3d977]' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-3 text-center">
            <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-[11px] text-[#71767b] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {mockOrders.map((order) => (
          <div key={order.id} className="rounded-xl bg-[#0a0a0a] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-mono text-[#71767b]">{order.id}</p>
              <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', getOrderStatusColor(order.status))}>
                <span className="text-[10px]">{STATUS_ICONS[order.status] || ''}</span>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-[#e8f0dc] truncate">{order.customerName}</h4>
                <p className="text-[13px] text-[#71767b] truncate">{order.product}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[15px] font-bold text-[#a3d977] block">{formatCurrency(order.amount)}</span>
                <span className="text-[11px] text-[#536471]">{order.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
