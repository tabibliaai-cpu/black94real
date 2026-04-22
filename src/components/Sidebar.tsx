'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/stores/app'
import { PAvatar, VerifiedBadge } from '@/components/PAvatar'
import { SidebarItem } from '@/components/SidebarItem'

// ─── Inline SVG Icons (premium stroke weight 2, consistent style) ──────────

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCompass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconStories({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={2} />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={2} />
    </svg>
  )
}

function IconBookmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
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
  { id: 'home', label: 'Home', icon: IconHome, view: 'feed' },
  { id: 'explore', label: 'Explore', icon: IconCompass, view: 'explore' },
  { id: 'notifications', label: 'Notifications', icon: IconBell, view: 'notifications' },
  { id: 'messages', label: 'Messages', icon: IconMail, view: 'chat' },
  { id: 'stories', label: 'Stories', icon: IconStories, view: 'stories' },
  { id: 'premium', label: 'Premium', icon: IconStar, view: 'premium-dashboard' },
  { id: 'profile', label: 'Profile', icon: IconUser, view: 'profile' },
  { id: 'bookmarks', label: 'Bookmarks', icon: IconBookmark, view: 'feed' },
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
  const { currentView, navigate, setSidebarOpen, sidebarOpen, user, unreadNotificationCount, composeOpen, setComposeOpen } = useAppStore()
  const isMobile = useIsMobile(768)
  const [expanded, setExpanded] = useState(true)

  const isExpanded = isMobile ? sidebarOpen : expanded
  const showDrawer = isMobile && sidebarOpen

  const handleNavigate = useCallback(
    (view: AppView) => {
      navigate(view)
      if (isMobile) useAppStore.getState().setSidebarOpen(false)
    },
    [navigate, isMobile]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && showDrawer) useAppStore.getState().setSidebarOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showDrawer])

  useEffect(() => {
    document.body.style.overflow = showDrawer ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showDrawer])

  const sidebarContent = (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'flex h-full flex-col bg-[#000000]',
        'transition-[width] duration-[250ms] ease-in-out',
        !isMobile && (isExpanded ? 'w-[260px]' : 'w-[72px]'),
        isMobile && 'w-[280px]'
      )}
    >
      {/* ── Top: Logo ── */}
      <div className={cn(
        'flex items-center shrink-0 px-4 pt-5 pb-2 h-[68px]',
        !isExpanded && 'justify-center'
      )}>
        {isExpanded ? (
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Black94" width={32} height={32} className="rounded-lg" unoptimized />
            <span className="text-lg font-black text-white tracking-tight select-none">Black94</span>
          </div>
        ) : (
          <Image src="/logo.png" alt="Black94" width={28} height={28} className="rounded-lg" unoptimized />
        )}
      </div>

      {/* ── Middle: Navigation ── */}
      <nav role="menu" className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {/* Post button — rose gold accent outline */}
        <button
          onClick={() => { setComposeOpen(!composeOpen); if (isMobile) useAppStore.getState().setSidebarOpen(false) }}
          className={cn(
            'w-full rounded-full font-extrabold text-[15px] transition-all duration-200 mb-4',
            'bg-[#D4A574] text-black hover:bg-[#E8C4A0] active:scale-[0.97]',
            'shadow-[0_2px_12px_rgba(212,165,116,0.3)]',
            isExpanded ? 'py-3 px-4' : 'py-3 px-0 flex items-center justify-center'
          )}
        >
          {isExpanded ? 'Post' : <IconPlus className="w-6 h-6" />}
        </button>

        <ul className="flex flex-col gap-0.5" role="menubar">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon
            const isActive = currentView === item.view
            const itemBadge = item.id === 'notifications' && unreadNotificationCount > 0 ? unreadNotificationCount : undefined

            // Profile item: same style as other items via SidebarItem
            return (
              <li key={item.id} role="none">
                <SidebarItem
                  icon={<IconComponent className="h-full w-full" />}
                  label={item.label}
                  active={isActive}
                  badge={itemBadge}
                  collapsed={!isExpanded}
                  onClick={() => handleNavigate(item.view)}
                />
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Bottom: Toggle + User ── */}
      <div className="shrink-0 px-3 py-3 space-y-1">
        {/* Post / More button for collapsed mode */}
        {!isMobile && (
          <button
            type="button"
            aria-label={isExpanded ? 'More options' : 'More'}
            onClick={() => setExpanded(!isExpanded)}
            className={cn(
              'flex items-center gap-3 rounded-full px-3 py-2.5 transition-all duration-150 w-full',
              'text-[#e7e9ea] hover:bg-white/[0.07]',
              'outline-none',
              !isExpanded && 'justify-center'
            )}
          >
            {isExpanded ? (
              <>
                <IconMore className="h-[26px] w-[26px] shrink-0" />
                <span className="text-[15px] font-extrabold select-none">More</span>
              </>
            ) : (
              <IconArrowLeft className="h-[26px] w-[26px] shrink-0" />
            )}
          </button>
        )}

        {/* User profile card */}
        <button
          type="button"
          aria-label="Go to profile"
          onClick={() => handleNavigate('profile')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-full p-2.5 transition-all duration-150',
            'hover:bg-white/[0.07]',
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
              <span className="truncate text-sm text-[#71767b] leading-tight">
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
        <div
          role="dialog"
          aria-hidden="true"
          className={cn(
            'fixed inset-0 z-40 bg-[#000000]/60 backdrop-blur-sm transition-opacity duration-300',
            showDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
        <div className={cn('fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out', showDrawer ? 'translate-x-0' : '-translate-x-full')}>
          {sidebarContent}
        </div>
      </>
    )
  }

  // ── Desktop: Fixed sidebar ──
  return <div className="fixed inset-y-0 left-0 z-30">{sidebarContent}</div>
}
