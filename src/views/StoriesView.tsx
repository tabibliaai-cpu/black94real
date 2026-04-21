'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { StoryUploadSheet } from '@/components/StoryUploadSheet'
import { fetchStoryGroups, fetchUserStories, type StoryGroup, type Story } from '@/lib/stories-db'
import { PAvatar, VerifiedBadge } from '@/components/PAvatar'
import { toast } from 'sonner'

/* ── Types ───────────────────────────────────────────────────────────── */

interface StoryItem {
  id: string
  imageUrl: string
  caption?: string
}

interface DisplayGroup {
  userId: string
  username: string
  displayName: string
  profileImage: string
  verified: boolean
  stories: StoryItem[]
}

const STORY_DURATION = 6000

/* ── Time formatter (X-style relative time) ──────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

/* ── Story Ring — thin gradient ring for unseen, gray for seen ───────── */

function StoryRing({
  viewed,
  children,
  size = 52,
}: {
  viewed: boolean
  children: React.ReactNode
  size?: number
}) {
  return (
    <div
      className="rounded-full shrink-0"
      style={{
        padding: '2.5px',
        background: viewed
          ? 'transparent'
          : 'conic-gradient(from 45deg, #8b5cf6, #2a7fff, #06b6d4, #f59e0b, #ef4444, #8b5cf6)',
      }}
    >
      <div
        className="rounded-full overflow-hidden"
        style={{
          padding: '1.5px',
          background: viewed ? '#2f3336' : '#000',
        }}
      >
        <div
          className="rounded-full overflow-hidden"
          style={{ width: size - 8, height: size - 8 }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FULL-SCREEN STORY VIEWER — X 2026 style
   ═══════════════════════════════════════════════════════════════════════════ */

function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: {
  groups: DisplayGroup[]
  initialGroupIndex: number
  onClose: () => void
}) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex)
  const [storyIdx, setStoryIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [liked, setLiked] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [reactionAnim, setReactionAnim] = useState<'heart' | 'fire' | null>(null)
  const [viewedGroups, setViewedGroups] = useState<Set<string>>(
    () => new Set()
  )
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(Date.now())
  const replyInputRef = useRef<HTMLInputElement>(null)

  // Touch / swipe tracking
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchDeltaX = useRef(0)

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  // Mark group as viewed
  useEffect(() => {
    if (group) {
      setViewedGroups((prev) => {
        const next = new Set(prev)
        next.add(group.userId)
        return next
      })
    }
  }, [groupIdx, group])

  // Auto-advance progress
  useEffect(() => {
    if (!story || paused) {
      clearInterval(timerRef.current)
      return
    }
    startRef.current = Date.now()
    setProgress(0)

    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(pct)

      if (pct >= 100) {
        goNext()
      }
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [groupIdx, storyIdx, paused]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (storyIdx + 1 < group.stories.length) {
      setStoryIdx((s) => s + 1)
    } else if (groupIdx + 1 < groups.length) {
      setGroupIdx((g) => g + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }, [storyIdx, groupIdx, group, groups.length, onClose])

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((s) => s - 1)
    } else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1)
      setStoryIdx(groups[groupIdx - 1].stories.length - 1)
    }
  }, [storyIdx, groupIdx, groups])

  // Tap zones — left 30% prev, right 70% next
  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't navigate if tapping on input area
      if ((e.target as HTMLElement).closest('[data-story-input]')) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = x / rect.width
      if (pct < 0.3) goPrev()
      else goNext()
    },
    [goNext, goPrev]
  )

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-story-input]')) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchDeltaX.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchDeltaX.current = touch.clientX - touchStartX.current
  }, [])

  const handleTouchEnd = useCallback(() => {
    const threshold = 50
    const deltaX = touchDeltaX.current
    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) goNext()
      else goPrev()
    }
    touchDeltaX.current = 0
  }, [goNext, goPrev])

  // Long press to pause
  const longPressRef = useRef<ReturnType<typeof setTimeout>>()
  const handlePointerDown = useCallback(() => {
    longPressRef.current = setTimeout(() => setPaused(true), 200)
  }, [])
  const handlePointerUp = useCallback(() => {
    clearTimeout(longPressRef.current)
    setPaused(false)
  }, [])

  // Double-tap to like
  const lastTapRef = useRef(0)
  const handleDoubleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setLiked(true)
      setReactionAnim('heart')
      setTimeout(() => setReactionAnim(null), 1000)
    }
    lastTapRef.current = now
  }, [])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  if (!story) return null

  const viewed = viewedGroups.has(group.userId)

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000] flex flex-col animate-fade-in select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* ─── Progress bars ─── */}
      <div className="absolute top-0 inset-x-0 z-30 flex gap-[3px] px-2 pt-2 safe-area-top">
        {group.stories.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[2px] rounded-full bg-white/25 overflow-hidden"
          >
            <div
              className={cn(
                'h-full rounded-full',
                i < storyIdx
                  ? 'w-full bg-white'
                  : i === storyIdx
                    ? paused
                      ? 'bg-white/70'
                      : 'bg-white'
                    : 'w-0'
              )}
              style={
                i === storyIdx
                  ? { width: `${progress}%`, transition: 'width 80ms linear' }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* ─── Top overlay: avatar + name + time + close ─── */}
      <div className="absolute top-3 inset-x-0 z-20 flex items-center justify-between px-3 pt-5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <StoryRing viewed={viewed} size={32}>
            {group.profileImage ? (
              <img
                src={group.profileImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold">
                {(group.displayName || 'U')[0]}
              </div>
            )}
          </StoryRing>
          <div className="min-w-0">
            <span className="text-[14px] font-bold text-white truncate inline-flex items-center gap-1">
              {group.username}
              {(group.verified || (group as any).badge) && (
                <VerifiedBadge size={14} badge={(group as any).badge} />
              )}
            </span>
            <p className="text-[11px] text-white/50 leading-tight">
              {timeAgo(group.stories[storyIdx]?.id ? new Date().toISOString() : '')}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 ml-2"
        >
          <svg
            className="w-[18px] h-[18px] text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ─── Story image area (swipeable + tappable) ─── */}
      <div
        className="flex-1 min-h-0 overflow-hidden relative"
        onClick={handleTap}
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Double-tap heart animation */}
        {reactionAnim && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span className="text-8xl animate-heart-burst">
              {reactionAnim === 'heart' ? '❤️' : '🔥'}
            </span>
          </div>
        )}

        <img
          src={story.imageUrl}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Caption overlay — bottom of image */}
        {story.caption && (
          <div className="absolute bottom-0 inset-x-0 px-4 pb-4 pt-12 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
            <p className="text-[14px] text-white/90 leading-snug">
              {story.caption}
            </p>
          </div>
        )}

        {/* Pause indicator */}
        {paused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom bar: reply input + actions ─── */}
      <div
        className="shrink-0 bg-black px-3 pt-2 pb-2 safe-area-bottom"
        data-story-input
      >
        {/* Reply input — X style rounded bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[36px] rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center px-3">
            <input
              ref={replyInputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Send message"
              className="flex-1 bg-transparent text-[14px] text-white placeholder-white/30 outline-none"
            />
          </div>

          {/* Like button */}
          <button
            onClick={() => setLiked(!liked)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors shrink-0"
          >
            <svg
              className={cn(
                'w-[20px] h-[20px] transition-all duration-200',
                liked ? 'text-[#f91880]' : 'text-white'
              )}
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={liked ? 0 : 1.8}
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>

          {/* Send button */}
          <button
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0',
              replyText.trim()
                ? 'text-[#1d9bf0] hover:bg-white/[0.06]'
                : 'text-white/30'
            )}
          >
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>

          {/* More button */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors shrink-0">
            <svg
              className="w-[18px] h-[18px] text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORIES VIEW — X 2026 style
   Top bar + horizontal tray + vertical story cards feed
   ═══════════════════════════════════════════════════════════════════════════ */

export function StoriesView() {
  const user = useAppStore((s) => s.user)
  const [firestoreGroups, setFirestoreGroups] = useState<StoryGroup[]>([])
  const [myStories, setMyStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  // Fetch stories from Firestore on mount & after upload
  const loadStories = useCallback(async () => {
    try {
      setLoading(true)
      const [groups, mySt] = await Promise.all([
        fetchStoryGroups().catch((e) => {
          console.error('[StoriesView] fetchStoryGroups failed:', e)
          toast.error('Failed to load stories. Check your connection.')
          return [] as StoryGroup[]
        }),
        user
          ? fetchUserStories(user.id).catch((e) => {
              console.error('[StoriesView] fetchUserStories failed:', e)
              return []
            })
          : Promise.resolve([]),
      ])
      setFirestoreGroups(groups)
      setMyStories(mySt)
    } catch (err) {
      console.error('[StoriesView] loadStories error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStories()
  }, [loadStories])

  // Build display groups: user's own first, then other users
  const displayGroups: DisplayGroup[] = []

  if (user && myStories.length > 0) {
    displayGroups.push({
      userId: user.id,
      username: user.username,
      displayName: user.displayName || 'You',
      profileImage: user.profileImage || '',
      verified: user.isVerified,
      stories: myStories.map((s) => ({
        id: s.id,
        imageUrl: s.mediaUrl,
        caption: s.caption || undefined,
      })),
    })
  }

  for (const g of firestoreGroups) {
    if (user && g.userId === user.id) continue
    displayGroups.push({
      userId: g.userId,
      username: g.username,
      displayName: g.displayName,
      profileImage: g.profileImage,
      verified: g.verified,
      stories: g.stories.map((s) => ({
        id: s.id,
        imageUrl: s.mediaUrl,
        caption: s.caption || undefined,
      })),
    })
  }

  const openStory = (idx: number) => {
    setActiveGroupIdx(idx)
  }

  const closeStory = () => {
    setActiveGroupIdx(null)
  }

  const handleStoryUploaded = useCallback(() => {
    loadStories()
  }, [loadStories])

  // ── Tray items: your story + others ──
  const trayGroups = displayGroups.filter((g) => g.userId !== user?.id)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ─── Top Bar: X logo + "Stories" title + camera icon ─── */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/[0.06] safe-area-top">
        <div className="flex items-center justify-between h-[53px] px-4">
          {/* Left: X logo */}
          <button
            onClick={() => useAppStore.getState().navigate('feed')}
            className="flex items-center"
          >
            <svg
              className="w-[28px] h-[28px] text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* Center: Stories title */}
          <h1 className="text-[17px] font-bold text-white absolute inset-x-0 text-center pointer-events-none">
            Stories
          </h1>

          {/* Right: Camera icon */}
          <button
            onClick={() => setUploadOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            aria-label="Create story"
          >
            <svg
              className="w-[22px] h-[22px] text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Stories Tray (Horizontal Scroll) ─── */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
          {/* Your Story */}
          <button
            onClick={() => (myStories.length > 0 ? openStory(0) : setUploadOpen(true))}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              {myStories.length > 0 ? (
                <StoryRing viewed={false} size={56}>
                  <img
                    src={myStories[0].mediaUrl}
                    alt="Your story"
                    className="w-full h-full object-cover"
                  />
                </StoryRing>
              ) : (
                <div className="w-[56px] h-[56px] rounded-full bg-white/[0.06] overflow-hidden flex items-center justify-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-[18px] text-white/50 font-bold">
                      {(user?.displayName || 'U')[0]}
                    </div>
                  )}
                </div>
              )}
              {/* + icon for add */}
              <div className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full bg-[#1d9bf0] flex items-center justify-center border-[2.5px] border-black">
                <svg
                  className="w-[12px] h-[12px] text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>
            <span className="text-[11px] text-white/50 max-w-[56px] truncate">
              Your story
            </span>
          </button>

          {/* Following stories */}
          {trayGroups.map((g) => {
            const idx = displayGroups.indexOf(g)
            return (
              <button
                key={g.userId}
                onClick={() => openStory(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <StoryRing viewed={false} size={56}>
                  {g.profileImage ? (
                    <img
                      src={g.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-[18px] text-white/50 font-bold">
                      {(g.displayName || 'U')[0]}
                    </div>
                  )}
                </StoryRing>
                <div className="flex items-center gap-0.5 max-w-[56px]">
                  <span className="text-[11px] text-white truncate">
                    {g.displayName.split(' ')[0]}
                  </span>
                  {g.verified && (
                    <VerifiedBadge size={11} badge={(g as any).badge} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Loading state ─── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}

      {/* ─── Empty state ─── */}
      {!loading && displayGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <h3 className="text-[15px] font-bold text-white mb-1">No stories yet</h3>
          <p className="text-[13px] text-white/40 text-center leading-relaxed">
            When people you follow share stories, they&apos;ll show up here.
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            className="mt-4 px-5 py-2 rounded-full bg-[#1d9bf0] text-white text-[14px] font-bold hover:bg-[#1a8cd8] transition-colors"
          >
            Create your story
          </button>
        </div>
      )}

      {/* ─── Vertical Stories Feed (Fleets 2.0 style) ─── */}
      {!loading && displayGroups.length > 0 && (
        <div className="divide-y divide-white/[0.04]">
          {displayGroups.map((g) => {
            const idx = displayGroups.indexOf(g)
            const latestStory = g.stories[0]
            return (
              <button
                key={g.userId}
                onClick={() => openStory(idx)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
              >
                {/* Avatar */}
                <StoryRing viewed={false} size={44}>
                  {g.profileImage ? (
                    <img
                      src={g.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-[14px] text-white/50 font-bold">
                      {(g.displayName || 'U')[0]}
                    </div>
                  )}
                </StoryRing>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name + time */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-white truncate">
                      {g.username}
                    </span>
                    {(g.verified || (g as any).badge) && (
                      <VerifiedBadge size={14} badge={(g as any).badge} />
                    )}
                    <span className="text-[13px] text-white/40 shrink-0">
                      &middot; {g.stories.length}h
                    </span>
                  </div>

                  {/* Story preview row */}
                  {latestStory && (
                    <div className="mt-2 flex gap-2">
                      {/* Thumbnail card */}
                      <div className="w-[72px] h-[96px] rounded-lg overflow-hidden bg-white/[0.04] shrink-0">
                        <img
                          src={latestStory.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Caption + more indicator */}
                      <div className="flex-1 min-w-0 py-0.5">
                        {latestStory.caption ? (
                          <p className="text-[13px] text-white/60 line-clamp-2 leading-snug">
                            {latestStory.caption}
                          </p>
                        ) : (
                          <p className="text-[13px] text-white/30 italic">
                            Tap to view story
                          </p>
                        )}
                        {g.stories.length > 1 && (
                          <p className="text-[12px] text-[#1d9bf0] mt-1">
                            +{g.stories.length - 1} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: chevron */}
                <div className="flex items-center pt-6 shrink-0">
                  <svg
                    className="w-[16px] h-[16px] text-white/20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ─── Bottom padding for MobileNav ─── */}
      <div className="h-[60px] shrink-0" />

      {/* Full-screen Story Viewer */}
      {activeGroupIdx !== null && displayGroups.length > 0 && (
        <StoryViewer
          groups={displayGroups}
          initialGroupIndex={activeGroupIdx}
          onClose={closeStory}
        />
      )}

      {/* Story Upload Sheet */}
      <StoryUploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onStoryUploaded={handleStoryUploaded}
      />
    </div>
  )
}
