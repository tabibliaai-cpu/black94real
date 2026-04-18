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
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#e8f0dc]' : 'text-[#71767b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        {active && <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    ),
  },
  {
    view: 'stories',
    label: 'Stories',
    icon: (active) => (
      <div className="relative w-[26px] h-[26px]">
        <div className={cn(
          'w-[26px] h-[26px] rounded-full',
          active ? 'ring-[2.5px] ring-[#a3d977]' : 'ring-[1.5px] ring-[#536471]'
        )} />
        <div className="absolute inset-[5px] rounded-full bg-black" />
        <div className="absolute inset-[5px] rounded-full bg-black flex items-center justify-center">
          <svg className={cn('w-3 h-3', active ? 'text-[#a3d977]' : 'text-[#71767b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
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
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#a3d977]' : 'text-[#71767b]')} viewBox="0 0 64 64" fill="currentColor">
        <ellipse cx="32" cy="26" rx="14" ry="16" />
        <path d="M18 38c0 0-3 6 2 14h24c5-8 2-14 2-14l-3.5 3.5-3.5-3.5-3.5 3.5-3.5-3.5-3.5 3.5-3.5-3.5z" />
        <circle cx="26" cy="22" r="2" fill="black" />
        <circle cx="38" cy="22" r="2" fill="black" />
      </svg>
    ),
  },
  {
    view: 'search',
    label: 'Search',
    icon: (active) => (
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#e8f0dc]' : 'text-[#71767b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-black/90 backdrop-blur-xl border-t border-white/[0.08] safe-area-bottom shrink-0">
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
