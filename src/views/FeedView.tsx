'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { fetchFeedPosts } from '@/lib/db'
import { checkPostInteractions, togglePostLike, togglePostRepost, togglePostBookmark } from '@/lib/social'
import { UserPostCard } from '@/components/UserPostCard'
import { toast } from 'sonner'
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore'

/* ── Skeleton loader ─────────────────────────────────────────────────── */

function FeedSkeleton() {
  return (
    <div className="border-b border-white/[0.06] px-5 py-4">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-white/[0.06] shimmer relative overflow-hidden" />
        <div className="flex-1 space-y-2.5">
          <div className="flex gap-2">
            <div className="h-4 w-24 rounded-2xl bg-white/[0.06] shimmer relative overflow-hidden" />
            <div className="h-4 w-16 rounded-2xl bg-white/[0.06] shimmer relative overflow-hidden" />
          </div>
          <div className="h-4 w-full rounded-2xl bg-white/[0.06] shimmer relative overflow-hidden" />
          <div className="h-4 w-3/4 rounded-2xl bg-white/[0.06] shimmer relative overflow-hidden" />
          <div className="flex gap-8 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-8 rounded bg-white/[0.06] shimmer relative overflow-hidden" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Feed Tabs ───────────────────────────────────────────────────────── */

const TABS = ['For you', 'Following'] as const
type Tab = (typeof TABS)[number]

/* ── Feed View ───────────────────────────────────────────────────────── */

export function FeedView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const setComposeOpen = useAppStore((s) => s.setComposeOpen)

  const [activeTab, setActiveTab] = useState<Tab>('For you')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [allLoaded, setAllLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const lastDocRef = useRef<DocumentSnapshot<DocumentData> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const postsLoadedRef = useRef(false)

  // Fetch posts — stable reference, no state dependencies
  const loadPosts = useCallback(async (reset = false) => {
    if (reset) {
      lastDocRef.current = null
      setAllLoaded(false)
    }

    try {
      if (reset) setLoading(true)
      else setLoadingMore(true)

      const result = await fetchFeedPosts(10, lastDocRef.current ?? undefined)

      if (result.posts.length === 0) {
        if (reset) setPosts([])
        setAllLoaded(true)
      } else {
        lastDocRef.current = result.lastDoc
        if (reset) {
          setPosts(result.posts)
          postsLoadedRef.current = true
        } else {
          setPosts((prev) => [...prev, ...result.posts])
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      if (reset) setPosts([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadPosts(true)
  }, [loadPosts])

  // After posts load, check user interaction status (likes, reposts, bookmarks)
  useEffect(() => {
    if (!user || !postsLoadedRef.current || posts.length === 0) return

    const realPosts = posts.filter((p: any) => !p.id?.startsWith('mock-'))
    if (realPosts.length === 0) return

    const postIds = realPosts.map((p: any) => p.id)
    checkPostInteractions(postIds, user.id).then((statusMap) => {
      setPosts((prev) =>
        prev.map((p: any) => {
          const status = statusMap[p.id]
          if (!status) return p
          return {
            ...p,
            isLiked: status.isLiked,
            isReposted: status.isReposted,
            isBookmarked: status.isBookmarked,
          }
        })
      )
    }).catch((err) => {
      console.error('Failed to check interactions:', err)
    })
  }, [user, posts.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    if (refreshing) return
    setRefreshing(true)
    loadPosts(true)
  }, [refreshing, loadPosts])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    if (allLoaded) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading) {
          loadPosts(false)
        }
      },
      { rootMargin: '400px' }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [allLoaded, loadingMore, loading, loadPosts])

  const handleLike = useCallback(async (postId: string) => {
    if (!user) return
    try {
      const nowLiked = await togglePostLike(postId, user.id)
      setPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId
            ? { ...p, isLiked: nowLiked, likeCount: (p.likeCount ?? 0) + (nowLiked ? 1 : -1) }
            : p
        )
      )
    } catch (err) {
      console.error('Like failed:', err)
      toast.error(err instanceof Error ? err.message : 'Like failed')
    }
  }, [user])

  const handleRepost = useCallback(async (postId: string) => {
    if (!user) return
    try {
      const isReposted = await togglePostRepost(postId, user.id)
      setPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId
            ? { ...p, isReposted, repostCount: (p.repostCount ?? 0) + (isReposted ? 1 : -1) }
            : p
        )
      )
    } catch (err) {
      console.error('Repost failed:', err)
      toast.error(err instanceof Error ? err.message : 'Repost failed')
    }
  }, [user])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user) return
    try {
      const isBookmarked = await togglePostBookmark(postId, user.id)
      setPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId ? { ...p, isBookmarked } : p
        )
      )
    } catch (err) {
      console.error('Bookmark failed:', err)
      toast.error(err instanceof Error ? err.message : 'Bookmark failed')
    }
  }, [user])

  return (
    <div>
      {/* Tabs */}
      <div className="sticky top-[56px] z-20 bg-[#09080f]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-4 text-[15px] font-medium relative transition-colors',
                activeTab === tab ? 'text-[#f0eef6] font-bold' : 'text-[#94a3b8]'
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 inset-x-6 h-1 bg-[#8b5cf6] rounded-full animate-tab-indicator" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Refreshing indicator */}
      {refreshing && (
        <div className="flex items-center justify-center py-2">
          <div className="w-5 h-5 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin" />
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <FeedSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#f0eef6] mb-1">No posts yet</h3>
          <p className="text-[15px] text-[#94a3b8]">When people post, their posts will show up here.</p>
        </div>
      ) : (
        <div>
          {posts.map((post: any) => (
            <UserPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onRepost={handleRepost}
              onBookmark={handleBookmark}
              onProfileTap={(uid: string) => {
                if (uid !== 'mock') navigate('user-profile', { userId: uid })
              }}
              userId={user?.id}
              userDisplayName={user?.displayName || undefined}
              userUsername={user?.username || undefined}
              userProfileImage={user?.profileImage || undefined}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading more */}
          {loadingMore && (
            <div className="py-4 space-y-0">
              <FeedSkeleton />
              <FeedSkeleton />
            </div>
          )}

          {/* End of feed */}
          {allLoaded && posts.length > 0 && (
            <div className="border-t border-white/[0.06] py-12 text-center">
              <p className="text-[15px] text-[#94a3b8]">You&apos;re caught up</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
