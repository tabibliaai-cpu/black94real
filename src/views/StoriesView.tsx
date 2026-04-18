'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { StoryUploadSheet } from '@/components/StoryUploadSheet'

/* ── Types ───────────────────────────────────────────────────────────── */

interface StoryItem {
  id: string
  imageUrl: string
}

interface StoryGroup {
  userId: string
  username: string
  displayName: string
  profileImage: string
  verified: boolean
  stories: StoryItem[]
  viewed: boolean
}

/* ── Mock data ───────────────────────────────────────────────────────── */

const MOCK_STORIES: StoryGroup[] = [
  {
    userId: 'u1', username: 'sarah_designs', displayName: 'Sarah Chen',
    profileImage: '', verified: true, viewed: false,
    stories: [
      { id: 's1a', imageUrl: 'https://picsum.photos/seed/s1a/1080/1920' },
      { id: 's1b', imageUrl: 'https://picsum.photos/seed/s1b/1080/1920' },
    ],
  },
  {
    userId: 'u2', username: 'alex_travel', displayName: 'Alex Rivera',
    profileImage: '', verified: false, viewed: false,
    stories: [
      { id: 's2a', imageUrl: 'https://picsum.photos/seed/s2a/1080/1920' },
    ],
  },
  {
    userId: 'u3', username: 'maya_photo', displayName: 'Maya Johnson',
    profileImage: '', verified: true, viewed: false,
    stories: [
      { id: 's3a', imageUrl: 'https://picsum.photos/seed/s3a/1080/1920' },
      { id: 's3b', imageUrl: 'https://picsum.photos/seed/s3b/1080/1920' },
      { id: 's3c', imageUrl: 'https://picsum.photos/seed/s3c/1080/1920' },
    ],
  },
  {
    userId: 'u4', username: 'jake_music', displayName: 'Jake Williams',
    profileImage: '', verified: false, viewed: true,
    stories: [
      { id: 's4a', imageUrl: 'https://picsum.photos/seed/s4a/1080/1920' },
    ],
  },
  {
    userId: 'u5', username: 'priya_food', displayName: 'Priya Patel',
    profileImage: '', verified: true, viewed: false,
    stories: [
      { id: 's5a', imageUrl: 'https://picsum.photos/seed/s5a/1080/1920' },
      { id: 's5b', imageUrl: 'https://picsum.photos/seed/s5b/1080/1920' },
    ],
  },
  {
    userId: 'u6', username: 'omar_tech', displayName: 'Omar Hassan',
    profileImage: '', verified: false, viewed: true,
    stories: [
      { id: 's6a', imageUrl: 'https://picsum.photos/seed/s6a/1080/1920' },
    ],
  },
  {
    userId: 'u7', username: 'luna_art', displayName: 'Luna Kim',
    profileImage: '', verified: false, viewed: false,
    stories: [
      { id: 's7a', imageUrl: 'https://picsum.photos/seed/s7a/1080/1920' },
      { id: 's7b', imageUrl: 'https://picsum.photos/seed/s7b/1080/1920' },
    ],
  },
  {
    userId: 'u8', username: 'noah_fitness', displayName: 'Noah Brooks',
    profileImage: '', verified: true, viewed: false,
    stories: [
      { id: 's8a', imageUrl: 'https://picsum.photos/seed/s8a/1080/1920' },
    ],
  },
  {
    userId: 'u9', username: 'zara_style', displayName: 'Zara Ahmed',
    profileImage: '', verified: false, viewed: true,
    stories: [
      { id: 's9a', imageUrl: 'https://picsum.photos/seed/s9a/1080/1920' },
    ],
  },
]

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
   FULL-SCREEN STORY VIEWER
   85% top = pure image, 15% bottom = user info + reactions
   ═══════════════════════════════════════════════════════════════════════════ */

function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: {
  groups: StoryGroup[]
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

  const reactions = [
    { type: 'heart' as const, emoji: '❤️', label: 'Love' },
    { type: 'fire' as const, emoji: '🔥', label: 'Fire' },
    { type: 'wow' as const, emoji: '😮', label: 'Wow' },
    { type: 'cry' as const, emoji: '😭', label: 'Sad' },
    { type: 'clap' as const, emoji: '👏', label: 'Clap' },
  ]

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

      {/* ─── 85% — Image area ─── */}
      <div
        className="relative flex-[85] min-h-0 select-none"
        onClick={handleTap}
        onDoubleClick={handleDoubleTap}
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

        {/* Gradient fade at bottom for smooth transition */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* ─── 15% — User info + Reactions ─── */}
      <div className="flex-[15] min-h-0 bg-[#09080f] flex flex-col justify-between px-4 pt-2 pb-3 safe-area-bottom">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-black font-bold text-sm shrink-0 overflow-hidden">
            {group.profileImage ? (
              <img src={group.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              (group.displayName || 'U')[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-bold text-white truncate">{group.displayName}</span>
              {group.verified && (
                <svg className="w-[14px] h-[14px] text-[#8b5cf6] shrink-0" viewBox="0 0 22 22" fill="none">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.853-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.271.586.702 1.084 1.24 1.438.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.225 1.261.275 1.894.144.634-.13 1.219-.435 1.69-.882.445-.47.749-1.055.878-1.691.13-.634.084-1.292-.139-1.899.586-.272 1.084-.701 1.438-1.24.354-.542.551-1.172.57-1.82z" fill="#8b5cf6" />
                  <path d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#000" />
                </svg>
              )}
            </div>
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
   STORIES VIEW — Grid of story avatars
   ═══════════════════════════════════════════════════════════════════════════ */

export function StoriesView() {
  const user = useAppStore((s) => s.user)
  const [groups, setGroups] = useState(MOCK_STORIES)
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [myStories, setMyStories] = useState<Array<{ id: string; imageUrl: string }>>([])

  const openStory = (idx: number) => {
    setActiveGroupIdx(idx)
  }

  const closeStory = () => {
    setActiveGroupIdx(null)
  }

  const handleStoryUploaded = (imageUrl: string) => {
    const newStory = { id: `my-${Date.now()}`, imageUrl }
    setMyStories((prev) => [...prev, newStory])
    setUploadOpen(false)
  }

  // Prepend user's own stories if they have any
  const allGroups = user && myStories.length > 0
    ? [
        {
          userId: user.id,
          username: user.username,
          displayName: user.displayName || 'You',
          profileImage: user.profileImage || '',
          verified: user.isVerified,
          viewed: false,
          stories: myStories,
        },
        ...groups,
      ]
    : groups

  // Group stories: unviewed first
  const unviewed = groups.filter((g) => !g.viewed)
  const viewed = groups.filter((g) => g.viewed)

  return (
    <div>
      {/* Header area */}
      <div className="px-4 pt-3 pb-2">
        <h2 className="text-xl font-bold text-[#f0eef6]">Stories</h2>
        <p className="text-[13px] text-[#94a3b8] mt-0.5">Tap to view updates from people you follow</p>
      </div>

      {/* Your story + Add */}
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
                    src={myStories[0].imageUrl}
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

          {/* Unviewed stories */}
          {unviewed.map((g, i) => (
            <button
              key={g.userId}
              onClick={() => openStory(allGroups.indexOf(g))}
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
              <span className="text-[11px] text-[#f0eef6] max-w-[64px] truncate">{g.displayName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06] mx-4" />

      {/* Viewed stories */}
      {viewed.length > 0 && (
        <div className="px-4 pt-4">
          <h3 className="text-[15px] font-bold text-[#94a3b8] mb-3">Viewed</h3>
          <div className="grid grid-cols-2 gap-3">
            {viewed.map((g) => (
              <button
                key={g.userId}
                onClick={() => openStory(allGroups.indexOf(g))}
                className="relative rounded-xl overflow-hidden aspect-[9/16] bg-white/[0.04] group"
              >
                <img
                  src={g.stories[0].imageUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-black font-bold text-[10px] shrink-0 overflow-hidden">
                      {g.profileImage ? (
                        <img src={g.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (g.displayName || 'U')[0]
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{g.displayName}</p>
                      <p className="text-[11px] text-[#94a3b8] truncate">@{g.username}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested for you */}
      <div className="px-4 pt-6 pb-4">
        <h3 className="text-[15px] font-bold text-[#94a3b8] mb-3">Suggested for you</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Creative Studio', user: 'creativestudio', seed: 'sug1' },
            { name: 'Nature Vibes', user: 'naturevibes', seed: 'sug2' },
            { name: 'Urban Pulse', user: 'urbanpulse', seed: 'sug3' },
            { name: 'Food Diary', user: 'fooddiary', seed: 'sug4' },
          ].map((s) => (
            <div
              key={s.user}
              className="relative rounded-xl overflow-hidden aspect-[9/16] bg-white/[0.04] group"
            >
              <img
                src={`https://picsum.photos/seed/${s.seed}/540/960`}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-2.5">
                <p className="text-[13px] font-semibold text-white">{s.name}</p>
                <p className="text-[11px] text-[#94a3b8]">@{s.user}</p>
              </div>
              <div className="absolute top-2 right-2">
                <button className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[12px] font-semibold hover:bg-white/30 transition-colors">
                  Follow
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-screen Story Viewer */}
      {activeGroupIdx !== null && (
        <StoryViewer
          groups={allGroups}
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
