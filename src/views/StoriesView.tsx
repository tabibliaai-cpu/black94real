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

const STORY_DURATION = 6000 // 6 seconds per story

/* ── Story Ring Component ────────────────────────────────────────────── */

function StoryRing({ viewed, children, size = 64 }: { viewed: boolean; children: React.ReactNode; size?: number }) {
  return (
    <div
      className={cn(
        'rounded-full p-[2.5px] shrink-0',
        viewed
          ? 'bg-white/20'
          : 'bg-gradient-to-tr from-[#8b5cf6] via-[#2a7fff] to-[#f91880]'
      )}
    >
      <div className="rounded-full bg-[#09080f] p-[2px]">
        <div className="rounded-full overflow-hidden" style={{ width: size - 10, height: size - 10 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   FULL-SCREEN STORY VIEWER — with touch swipe
   85% top = pure image, 15% bottom = user info + reactions
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
  const [liked, setLiked] = useState(false)
  const [reactionAnim, setReactionAnim] = useState<'heart' | 'fire' | 'wow' | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(Date.now())

  // Touch / swipe tracking
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchDeltaX = useRef(0)

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  // Auto-advance progress
  useEffect(() => {
    if (!story) return
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
  }, [groupIdx, storyIdx]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    if (pct < 0.3) goPrev()
    else goNext()
  }, [goNext, goPrev])

  // ── Touch swipe handlers ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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
    const deltaY = Math.abs(touchStartY.current) // not used for direction, just reference

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        // Swipe left → next story
        goNext()
      } else {
        // Swipe right → previous story
        goPrev()
      }
    }
    touchDeltaX.current = 0
  }, [goNext, goPrev])

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

  return (
    <div className="fixed inset-0 z-50 bg-[#09080f] flex flex-col animate-fade-in">
      {/* ─── Progress bars ─── */}
      <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-2 pt-2 safe-area-top">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-100',
                i < storyIdx ? 'w-full bg-white' : i === storyIdx ? 'bg-white' : 'w-0 bg-white/0'
              )}
              style={i === storyIdx ? { width: `${progress}%` } : undefined}
            />
          </div>
        ))}
      </div>

      {/* ─── Close button ─── */}
      <button
        onClick={onClose}
        className="absolute top-4 right-3 z-20 w-9 h-9 rounded-full bg-[#09080f]/40 backdrop-blur-sm flex items-center justify-center hover:bg-[#09080f]/60 transition-colors"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>

      {/* ─── 85% — Image area (swipeable) ─── */}
      <div
        className="relative flex-[85] min-h-0 select-none overflow-hidden"
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
              {reactionAnim === 'heart' ? '❤️' : reactionAnim === 'fire' ? '🔥' : '😮'}
            </span>
          </div>
        )}

        <img
          src={story.imageUrl}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Caption overlay */}
        {story.caption && (
          <div className="absolute bottom-0 inset-x-0 px-4 pb-2 pt-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
            <p className="text-[14px] text-white/90">{story.caption}</p>
          </div>
        )}
      </div>

      {/* ─── 15% — User info + Reactions ─── */}
      <div className="flex-[15] min-h-0 bg-[#09080f] flex flex-col justify-between px-4 pt-2 pb-3 safe-area-bottom">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <PAvatar src={group.profileImage} name={group.displayName} size={36} verified={group.verified} badge={(group as any).badge} />
          <div className="flex-1 min-w-0">
            <span className="text-[14px] font-bold text-white truncate">{group.displayName}</span>
            <br />
            <span className="text-[12px] text-[#94a3b8]">@{group.username}</span>
          </div>
        </div>

        {/* Reaction buttons */}
        <div className="flex items-center justify-between mt-2">
          {/* Left: text input area (visual only) */}
          <div className="flex-1 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center px-3 mr-3">
            <span className="text-[13px] text-[#64748b]">Send message</span>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={() => { setLiked(!liked) }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            >
              <svg
                className={cn('w-[22px] h-[22px] transition-colors', liked ? 'text-[#f91880]' : 'text-white')}
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={liked ? 0 : 1.8}
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>

            {/* Send */}
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors">
              <svg className="w-[20px] h-[20px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* More */}
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors">
              <svg className="w-[20px] h-[20px] text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   STORIES VIEW — Grid of story avatars (real data from Firestore)
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
      // Fetch groups and user stories in parallel
      const [groups, mySt] = await Promise.all([
        fetchStoryGroups().catch((e) => {
          console.error('[StoriesView] fetchStoryGroups failed:', e)
          toast.error('Failed to load stories. Check your connection.')
          return [] as StoryGroup[]
        }),
        user ? fetchUserStories(user.id).catch((e) => {
          console.error('[StoriesView] fetchUserStories failed:', e)
          return [] as Story[]
        }) : Promise.resolve([]),
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

  // User's own stories first (if any)
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

  // Other users' stories (excluding current user)
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

  // Show all stories as "unviewed" ring style (gradient)
  return (
    <div className="min-h-screen pb-4">
      {/* Header area */}
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-xl font-bold text-[#f0eef6]">Stories</h2>
        <p className="text-[13px] text-[#94a3b8] mt-0.5">Tap to view updates from people you follow</p>
      </div>

      {/* Your story + Story ring bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
          {/* Your Story */}
          <button
            onClick={() => setUploadOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              {myStories.length > 0 ? (
                <StoryRing viewed={false} size={64}>
                  <img
                    src={myStories[0].mediaUrl}
                    alt="Your story"
                    className="w-full h-full object-cover"
                  />
                </StoryRing>
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/[0.06] border-2 border-dashed border-white/[0.2] flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1a2a1a] to-[#110f1a] flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              )}
              {/* Camera icon overlay */}
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#8b5cf6] flex items-center justify-center border-2 border-[#110f1a]">
                <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <span className="text-[11px] text-[#94a3b8]">Your story</span>
          </button>

          {/* Other users' stories (ring bar) */}
          {displayGroups.filter((g) => g.userId !== user?.id).map((g, i) => (
            <button
              key={g.userId}
              onClick={() => openStory(displayGroups.indexOf(g))}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <StoryRing viewed={false} size={64}>
                {g.profileImage ? (
                  <img src={g.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a2a1a] to-[#110f1a] flex items-center justify-center text-[16px] text-[#8b5cf6] font-bold">
                    {(g.displayName || 'U')[0]}
                  </div>
                )}
              </StoryRing>
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] text-[#f0eef6] max-w-[64px] truncate">{g.displayName.split(' ')[0]}</span>
                {g.verified && <VerifiedBadge size={12} badge={(g as any).badge} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06] mx-4" />

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && displayGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <h3 className="text-[16px] font-semibold text-[#f0eef6] mb-1">No stories yet</h3>
          <p className="text-[14px] text-[#94a3b8] text-center">Be the first to share a story! Tap the button above to get started.</p>
        </div>
      )}

      {/* Story grid (thumbnail cards for each group) */}
      {!loading && displayGroups.length > 0 && (
        <div className="px-4 pt-4">
          <h3 className="text-[15px] font-bold text-[#94a3b8] mb-3">Recent Stories</h3>
          <div className="grid grid-cols-2 gap-3">
            {displayGroups.map((g) => (
              <button
                key={g.userId}
                onClick={() => openStory(displayGroups.indexOf(g))}
                className="relative rounded-xl overflow-hidden aspect-[9/16] bg-white/[0.04] group"
              >
                <img
                  src={g.stories[0].imageUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Story count badge */}
                {g.stories.length > 1 && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#09080f]/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-[11px] text-white font-bold">{g.stories.length}</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  <div className="flex items-center gap-2">
                    <PAvatar src={g.profileImage} name={g.displayName} size={28} verified={g.verified} badge={(g as any).badge} />
                    <div className="text-left min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{g.displayName}</p>
                      <p className="text-[11px] text-[#94a3b8] truncate">
                        @{g.username} · {g.stories.length} {g.stories.length === 1 ? 'story' : 'stories'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
