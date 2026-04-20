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
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#f0eef6]' : 'text-[#64748b]')} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    view: 'search',
    label: 'Search',
    icon: (active) => (
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#f0eef6]' : 'text-[#64748b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    view: 'explore',
    label: 'Explore',
    icon: (active) => (
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#f0eef6]' : 'text-[#64748b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.34a4 4 0 0 1 3 3.87" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    view: 'notifications',
    label: 'Activity',
    icon: (active) => (
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#f0eef6]' : 'text-[#64748b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a1.94 1.94 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    view: 'chat',
    label: 'Messages',
    icon: (active) => (
      <svg className={cn('w-[26px] h-[26px]', active ? 'text-[#f0eef6]' : 'text-[#64748b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  const setComposeOpen = useAppStore((s) => s.setComposeOpen)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#09080f]/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom shrink-0">
      <div className="flex items-center justify-around h-[50px] px-1">
        {NAV_ITEMS.map(({ view, label, icon }, index) => {
          const isActive = currentView === view

          // Insert compose button after the 3rd nav item (Explore)
          const isAfterExplore = index === 3

          return (
            <div key={view} className="contents">
              {/* Compose FAB — raised center button */}
              {isAfterExplore && (
                <button
                  onClick={() => setComposeOpen(true)}
                  className="flex items-center justify-center -mt-5"
                  aria-label="Create new post"
                >
                  <div className="w-[48px] h-[48px] rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] active:scale-95 flex items-center justify-center shadow-lg shadow-[#1d9bf0]/25 transition-all duration-150">
                    <svg className="w-[28px] h-[28px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Nav item */}
              <button
                onClick={() => onNavigate(view)}
                className="flex flex-col items-center justify-center w-[60px] h-full relative transition-colors duration-150"
                aria-label={label}
              >
                {icon(isActive)}
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
