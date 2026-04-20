'use client'

import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/stores/app'

interface MobileNavProps {
  currentView: AppView
  onNavigate: (view: AppView) => void
}

const NAV_ITEMS: { view: AppView; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    view: 'feed',
    label: 'Home',
    icon: (active) => (
      <svg className={cn('w-[24px] h-[24px]', active ? 'text-[#e7e9ea]' : 'text-[#d1d5db]')} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        {active && <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    ),
  },
  {
    view: 'search',
    label: 'Search',
    icon: (active) => (
      <svg className={cn('w-[24px] h-[24px]', active ? 'text-[#e7e9ea]' : 'text-[#d1d5db]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    view: 'chat',
    label: 'Chat',
    icon: (active) => (
      <svg className={cn('w-[24px] h-[24px]', active ? 'text-[#e7e9ea]' : 'text-[#d1d5db]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    view: 'notifications',
    label: 'Alerts',
    icon: (active) => (
      <svg className={cn('w-[24px] h-[24px]', active ? 'text-[#e7e9ea]' : 'text-[#d1d5db]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    view: 'stories',
    label: 'Stories',
    icon: (active) => (
      <div className="relative w-[24px] h-[24px]">
        <div className={cn(
          'w-[24px] h-[24px] rounded-full',
          active ? 'ring-[2.5px] ring-[#8b5cf6]' : 'ring-[2px] ring-[#d1d5db]'
        )} />
        <div className="absolute inset-[4px] rounded-full bg-[#000000]" />
        <div className="absolute inset-[4px] rounded-full bg-[#000000] flex items-center justify-center">
          <svg className={cn('w-2.5 h-2.5', active ? 'text-[#8b5cf6]' : 'text-[#d1d5db]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <circle cx="12" cy="12" r="5" />
          </svg>
        </div>
      </div>
    ),
  },
  {
    view: 'anonymous-chat',
    label: 'Anon',
    icon: (active) => (
      <svg className={cn('w-[24px] h-[24px]', active ? 'text-[#8b5cf6]' : 'text-[#d1d5db]')} viewBox="0 0 64 64" fill="currentColor">
        <ellipse cx="32" cy="26" rx="14" ry="16" />
        <path d="M18 38c0 0-3 6 2 14h24c5-8 2-14 2-14l-3.5 3.5-3.5-3.5-3.5 3.5-3.5-3.5-3.5 3.5-3.5-3.5z" />
        <circle cx="26" cy="22" r="2" fill="black" />
        <circle cx="38" cy="22" r="2" fill="black" />
      </svg>
    ),
  },
]

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#000000] border-t border-white/[0.06] safe-area-bottom shrink-0">
      <div className="flex items-center justify-around h-[50px]">
        {NAV_ITEMS.map(({ view, label, icon }) => {
          const isActive = currentView === view
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className="flex flex-col items-center justify-center w-16 h-full relative transition-colors duration-150"
              aria-label={label}
            >
              {icon(isActive)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
