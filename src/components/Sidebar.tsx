'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/stores/app'
import { PAvatar, VerifiedBadge } from '@/components/PAvatar'
import { SidebarItem } from '@/components/SidebarItem'

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={1.8} />
    </svg>
  )
}

function IconCompass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.8} />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBookmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPeople({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 12h18M3 6h18M3 18h18"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Navigation Config ───────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
  icon: (props: { className?: string }) => ReactNode
  view: AppView
  badge?: string | number
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'premium',
    label: 'Premium',
    icon: IconStar,
    view: 'premium-dashboard',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: IconUser,
    view: 'profile',
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: IconCompass,
    view: 'explore',
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: IconBookmark,
    view: 'feed',
  },
  {
    id: 'communities',
    label: 'Communities',
    icon: IconPeople,
    view: 'feed',
  },
]

// ─── Responsive Hook ─────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}

// ─── Sidebar Component ───────────────────────────────────────────────────────

export function Sidebar() {
  const { currentView, navigate, setSidebarOpen, sidebarOpen, user } = useAppStore()
  const isMobile = useIsMobile(768)
  const [expanded, setExpanded] = useState(true)

  // On mobile, always show expanded when drawer is open
  const isExpanded = isMobile ? sidebarOpen : expanded
  const showDrawer = isMobile && sidebarOpen

  // Close drawer on route change (mobile)
  const handleNavigate = useCallback(
    (view: AppView) => {
      navigate(view)
      if (isMobile) {
        useAppStore.getState().setSidebarOpen(false)
      }
    },
    [navigate, isMobile]
  )

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDrawer) {
        useAppStore.getState().setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showDrawer])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (showDrawer) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showDrawer])

  const sidebarContent = (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'flex h-full flex-col bg-[#000000]',
        // Smooth width transition
        'transition-[width] duration-[250ms] ease-in-out',
        // Desktop
        !isMobile && (isExpanded ? 'w-[260px]' : 'w-[72px]'),
        // Mobile drawer
        isMobile && 'w-[280px]'
      )}
    >
      {/* ── Top: Logo ── */}
      <div className={cn(
        'flex items-center shrink-0 px-4 pt-5 pb-2',
        isExpanded ? 'h-[68px]' : 'h-[68px] justify-center'
      )}>
        {isExpanded ? (
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Black94"
              width={32}
              height={32}
              className="rounded-lg"
              unoptimized
            />
            <span className="text-lg font-bold text-white tracking-tight select-none">
              Black94
            </span>
          </div>
        ) : (
          <Image
            src="/logo.png"
            alt="Black94"
            width={28}
            height={28}
            className="rounded-lg"
            unoptimized
          />
        )}
      </div>

      {/* ── Middle: Navigation ── */}
      <nav
        role="menu"
        className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin"
      >
        <ul className="flex flex-col gap-1" role="menubar">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon
            const isActive = currentView === item.view

            // Special: Profile item shows user avatar + verified badge
            if (item.id === 'profile') {
              return (
                <li key={item.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    aria-label="Profile"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleNavigate(item.view)}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-all duration-200 ease-in-out outline-none w-full',
                      'focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
                      isActive
                        ? 'font-bold text-[#e7e9ea] bg-white/[0.08]'
                        : 'text-gray-300 hover:text-[#e7e9ea] hover:bg-white/[0.06]',
                      !isExpanded && 'justify-center'
                    )}
                  >
                    <PAvatar
                      src={user?.profileImage}
                      name={user?.displayName || user?.username}
                      size={isExpanded ? 26 : 28}
                      verified={user?.isVerified}
                      badge={user?.badge}
                    />
                    {isExpanded && (
                      <span className="truncate select-none inline-flex items-center gap-1.5">
                        Profile
                        {(user?.isVerified || !!user?.badge) && <VerifiedBadge size={15} badge={user?.badge} />}
                      </span>
                    )}
                  </button>
                </li>
              )
            }

            return (
              <li key={item.id} role="none">
                <SidebarItem
                  icon={<IconComponent className="h-full w-full" />}
                  label={item.label}
                  active={isActive}
                  badge={item.badge}
                  collapsed={!isExpanded}
                  onClick={() => handleNavigate(item.view)}
                />
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Bottom: Toggle + User ── */}
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-3">
        {/* Toggle button */}
        {!isMobile && (
          <button
            type="button"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={() => setExpanded(!isExpanded)}
            className={cn(
              'mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-300 transition-all duration-200',
              'hover:bg-white/[0.04] hover:text-white',
              'focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              'outline-none',
              !isExpanded && 'justify-center'
            )}
          >
            {isExpanded ? (
              <>
                <IconMenu className="h-[26px] w-[26px] shrink-0" />
                <span className="text-[15px] select-none">Collapse</span>
              </>
            ) : (
              <IconArrowLeft className="h-[26px] w-[26px] shrink-0" />
            )}
          </button>
        )}

        {/* User profile */}
        <button
          type="button"
          aria-label="Go to profile"
          onClick={() => handleNavigate('profile')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl p-2.5 transition-all duration-200',
            'hover:bg-white/[0.04]',
            'focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
            'outline-none',
            !isExpanded && 'justify-center'
          )}
        >
          <PAvatar
            src={user?.profileImage}
            name={user?.displayName || user?.username}
            size={36}
            verified={user?.isVerified}
            badge={user?.badge}
          />

          {isExpanded && (
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="truncate text-sm font-bold text-white leading-tight inline-flex items-center gap-1.5">
                {user?.displayName || 'User'}
                {(user?.isVerified || !!user?.badge) && <VerifiedBadge size={16} badge={user?.badge} />}
              </span>
              <span className="truncate text-sm text-gray-500 leading-tight">
                @{user?.username || 'user'}
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )

  // ── Mobile: Drawer overlay ──
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          role="dialog"
          aria-hidden="true"
          className={cn(
            'fixed inset-0 z-40 bg-[#000000]/50 backdrop-blur-sm transition-opacity duration-300',
            showDrawer
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          )}
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
          aria-label="Close sidebar"
        />

        {/* Drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
            showDrawer ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </div>
      </>
    )
  }

  // ── Desktop: Fixed sidebar ──
  return (
    <div className="fixed inset-y-0 left-0 z-30">
      {sidebarContent}
    </div>
  )
}
