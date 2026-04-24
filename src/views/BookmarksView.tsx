'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/app'
import { checkPostInteractions, togglePostLike, togglePostRepost, togglePostBookmark } from '@/lib/social'
import { UserPostCard } from '@/components/UserPostCard'

export function BookmarksView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchBookmarkedPosts = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(false)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore')

      // 1. Get all bookmark docs for this user
      const bookmarksRef = collection(db, 'post_bookmarks')
      const q = query(bookmarksRef, where('userId', '==', user.id))
      const snap = await getDocs(q)

      if (snap.empty) {
        setPosts([])
        setLoading(false)
        return
      }

      // 2. Collect postIds and fetch each post
      const postIds = snap.docs.map(d => d.data().postId).filter(Boolean)
      // Deduplicate
      const uniqueIds = [...new Set(postIds)]

      // Firestore 'in' supports max 30 — chunk
      const CHUNK = 30
      const allPosts: any[] = []

      for (let i = 0; i < uniqueIds.length; i += CHUNK) {
        const chunk = uniqueIds.slice(i, i + CHUNK)
        const postsRef = collection(db, 'posts')
        const postQuery = query(postsRef, where('__name__', 'in', chunk))
        try {
          const postSnaps = await getDocs(postQuery)
          postSnaps.docs.forEach(docSnap => {
            const d = docSnap.data()
            allPosts.push({
              id: docSnap.id,
              authorId: d.authorId ?? '',
              authorUsername: d.authorUsername ?? '',
              authorDisplayName: d.authorDisplayName ?? '',
              authorProfileImage: d.authorProfileImage ?? '',
              authorBadge: d.authorBadge ?? '',
              authorIsVerified: d.authorIsVerified ?? false,
              caption: d.caption ?? '',
              mediaUrls: d.mediaUrls ?? '',
              factCheck: d.factCheck ?? '',
              likeCount: d.likeCount ?? 0,
              commentCount: d.commentCount ?? 0,
              repostCount: d.repostCount ?? 0,
              isLiked: false,
              isReposted: false,
              isBookmarked: true, // All are bookmarked by definition
              createdAt: d.createdAt?.seconds
                ? new Date(d.createdAt.seconds * 1000 + (d.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
                : (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()),
              updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : '',
            })
          })
        } catch {
          // Fallback: fetch one by one
          for (const pid of chunk) {
            try {
              const postSnap = await getDoc(doc(db, 'posts', pid))
              if (postSnap.exists()) {
                const d = postSnap.data()
                allPosts.push({
                  id: postSnap.id,
                  authorId: d.authorId ?? '',
                  authorUsername: d.authorUsername ?? '',
                  authorDisplayName: d.authorDisplayName ?? '',
                  authorProfileImage: d.authorProfileImage ?? '',
                  authorBadge: d.authorBadge ?? '',
                  authorIsVerified: d.authorIsVerified ?? false,
                  caption: d.caption ?? '',
                  mediaUrls: d.mediaUrls ?? '',
                  factCheck: d.factCheck ?? '',
                  likeCount: d.likeCount ?? 0,
                  commentCount: d.commentCount ?? 0,
                  repostCount: d.repostCount ?? 0,
                  isLiked: false,
                  isReposted: false,
                  isBookmarked: true,
                  createdAt: d.createdAt?.seconds
                    ? new Date(d.createdAt.seconds * 1000 + (d.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
                    : (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()),
                  updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : '',
                })
              }
            } catch { /* skip deleted posts */ }
          }
        }
      }

      // Sort by bookmark time (newest first) — use createdAt as proxy
      // Also check interaction statuses for likes/reposts
      if (user.id && allPosts.length > 0) {
        try {
          const ids = allPosts.map(p => p.id)
          const statusMap = await checkPostInteractions(ids, user.id)
          allPosts.forEach(p => {
            const status = statusMap[p.id]
            if (status) {
              p.isLiked = status.isLiked
              p.isReposted = status.isReposted
            }
          })
        } catch { /* non-critical */ }
      }

      // Sort newest first
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setPosts(allPosts)
    } catch (err) {
      console.error('[Bookmarks] Failed to fetch:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchBookmarkedPosts() }, [fetchBookmarkedPosts])

  const handleLike = useCallback(async (postId: string) => {
    if (!user) return
    try {
      await togglePostLike(postId, user.id)
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: (p.likeCount ?? 0) + (p.isLiked ? -1 : 1) } : p
      ))
    } catch (err) { console.error('Like failed:', err) }
  }, [user])

  const handleRepost = useCallback(async (postId: string) => {
    if (!user) return
    try {
      const isReposted = await togglePostRepost(postId, user.id)
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, isReposted, repostCount: (p.repostCount ?? 0) + (isReposted ? 1 : -1) } : p
      ))
    } catch (err) { console.error('Repost failed:', err) }
  }, [user])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user) return
    try {
      const isBookmarked = await togglePostBookmark(postId, user.id)
      // Remove from list if unbookmarked
      if (!isBookmarked) {
        setPosts(prev => prev.filter(p => p.id !== postId))
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: true } : p))
      }
    } catch (err) { console.error('Bookmark failed:', err) }
  }, [user])

  if (loading) {
    return (
      <div className="divide-y divide-white/[0.06]">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.06] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 bg-white/[0.06] rounded" />
                <div className="h-3 w-20 bg-white/[0.04] rounded" />
                <div className="h-3 w-full bg-white/[0.04] rounded" />
                <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <svg className="w-12 h-12 text-[#64748b] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-[15px] text-[#e7e9ea] font-medium mb-1">Failed to load bookmarks</p>
        <button
          onClick={fetchBookmarkedPosts}
          className="mt-3 px-5 py-2 rounded-full bg-white/[0.06] text-[14px] text-[#e7e9ea] hover:bg-white/[0.1] transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </div>
        <h3 className="text-[17px] font-bold text-[#e7e9ea] mb-1">No bookmarks yet</h3>
        <p className="text-[14px] text-[#94a3b8] max-w-[260px]">
          Save posts you love by tapping the bookmark icon. They'll show up here.
        </p>
        <button
          onClick={() => navigate('feed')}
          className="mt-4 px-5 py-2.5 rounded-full bg-[#e7e9ea] text-black text-[15px] font-bold hover:bg-gray-200 active:scale-[0.98] transition-all"
        >
          Explore posts
        </button>
      </div>
    )
  }

  return (
    <div>
      {posts.map(post => (
        <UserPostCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onRepost={handleRepost}
          onBookmark={handleBookmark}
          onProfileTap={(uid) => navigate('user-profile', { userId: uid })}
          userId={user?.id}
          userDisplayName={user?.displayName || undefined}
          userUsername={user?.username || undefined}
          userProfileImage={user?.profileImage || undefined}
        />
      ))}
    </div>
  )
}
