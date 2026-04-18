'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

interface SidebarItemProps {
  icon: ReactNode
  label: string
  active: boolean
  badge?: string | number
  collapsed: boolean
  onClick: () => void
}

export function SidebarItem({
  icon,
  label,
  active,
  badge,
  collapsed,
  onClick,
}: SidebarItemProps) {
  const showBadge = badge !== undefined && badge !== null && badge !== 0

  const itemContent = (
    <button
      type="button"
      role="menuitem"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}

      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-all duration-200 ease-in-out outline-none',
        'focus-visible:ring-2 focus-visible:ring-[#a3d977]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07060b]',
        active
          ? 'font-bold text-white'
          : 'text-gray-300 hover:text-white',
        active
          ? 'bg-white/[0.08]'
          : 'hover:bg-white/[0.04]',
        collapsed ? 'justify-center' : 'w-full'
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'shrink-0 transition-colors duration-200',
          active ? 'text-[#a3d977]' : 'text-gray-400 group-hover:text-white',
          'h-[26px] w-[26px]'
        )}
      >
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span className="truncate select-none">{label}</span>
      )}

      {/* Badge */}
      {showBadge && !collapsed && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a3d977] px-1.5 text-xs font-bold text-black">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Badge dot for collapsed */}
      {showBadge && collapsed && (
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#a3d977] ring-2 ring-[#07060b]" />
      )}
    </button>
  )

  // Collapsed mode: wrap with tooltip
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="rounded-lg border border-white/10 bg-[#1a1823] px-3 py-1.5 text-sm font-medium text-white shadow-lg"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return itemContent
}
