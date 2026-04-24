'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/app'
import { PAvatar, VerifiedBadge } from '@/components/PAvatar'
import { toast } from 'sonner'

const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
]

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ExploreView() {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [activeCategory, setActiveCategory] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')

  // Trending topics (extracted from recent posts)
  const [trendingTopics, setTrendingTopics] = useState<Array<{ tag: string; count: number }>>([])
  const [trendingLoading, setTrendingLoading] = useState(true)

  // Suggested users
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(true)
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())

  // Trending posts for selected category
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate('search', { q: query.trim() })
    }
  }

  // Fetch trending topics from recent posts (extract hashtags)
  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore')
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50))
      const snap = await getDocs(q)

      // Count hashtag occurrences
      const tagCounts: Record<string, number> = {}
      snap.docs.forEach(docSnap => {
        const caption = docSnap.data().caption || ''
        const tags = caption.match(/#[\w]+/g)
        if (tags) {
          tags.forEach(tag => {
            tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] || 0) + 1
          })
        }
      })

      // Sort by count, take top 8
      const sorted = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }))

      setTrendingTopics(sorted)
    } catch (err) {
      console.error('[Explore] Failed to fetch trending:', err)
    } finally {
      setTrendingLoading(false)
    }
  }, [])

  // Fetch suggested users (exclude self, exclude already followed)
  const fetchSuggestions = useCallback(async () => {
    if (!user?.id) return
    setSuggestedLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, limit, getDocs, where } = await import('firebase/firestore')

      // Get users the current user already follows
      const followsRef = collection(db, 'follows')
      const followsQuery = query(followsRef, where('followerId', '==', user.id))
      const followsSnap = await getDocs(followsQuery)
      const followingIds = new Set(followsSnap.docs.map(d => d.data().followingId))
      followingIds.add(user.id) // exclude self
      setFollowedUsers(followingIds)

      // Fetch a batch of random users (most recent signups)
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, limit(10))
      const usersSnap = await getDocs(usersRef)

      // Filter out already-followed and self
      const suggestions = usersSnap.docs
        .map(d => {
          const data = d.data()
          return {
            id: d.id,
            username: data.username || '',
            displayName: data.displayName || '',
            profileImage: data.profileImage || '',
            isVerified: data.isVerified || false,
            badge: data.badge || '',
            bio: data.bio || '',
          }
        })
        .filter(u => !followingIds.has(u.id) && u.id !== user.id)
        .slice(0, 5)

      setSuggestedUsers(suggestions)
    } catch (err) {
      console.error('[Explore] Failed to fetch suggestions:', err)
    } finally {
      setSuggestedLoading(false)
    }
  }, [user?.id])

  // Fetch posts for category (search by category keyword)
  const fetchCategoryPosts = useCallback(async (category: string) => {
    if (category === 'trending') {
      // For trending, show recent popular posts
      setPostsLoading(true)
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore')
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20))
        const snap = await getDocs(q)
        const result = snap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            authorId: data.authorId || '',
            authorUsername: data.authorUsername || '',
            authorDisplayName: data.authorDisplayName || '',
            authorProfileImage: data.authorProfileImage || '',
            authorBadge: data.authorBadge || '',
            authorIsVerified: data.authorIsVerified || false,
            caption: data.caption || '',
            mediaUrls: data.mediaUrls || '',
            likeCount: data.likeCount || 0,
            commentCount: data.commentCount || 0,
            repostCount: data.repostCount || 0,
            createdAt: data.createdAt?.seconds
              ? new Date(data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
              : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
          }
        }).sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        setPosts(result)
      } catch (err) {
        console.error('[Explore] Failed to fetch posts:', err)
        setPosts([])
      } finally {
        setPostsLoading(false)
      }
      return
    }

    // For other categories, search posts by category keyword
    const keywords: Record<string, string> = {
      tech: 'tech',
      music: 'music',
      sports: 'sports',
      news: 'news',
      entertainment: 'entertainment',
    }
    const keyword = keywords[category]
    if (!keyword) return

    setPostsLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, getDocs, where } = await import('firebase/firestore')
      const q = query(
        collection(db, 'posts'),
        where('caption', '>=', keyword),
        where('caption', '<=', keyword + '\uf8ff'),
      )
      const snap = await getDocs(q)
      const result = snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          authorId: data.authorId || '',
          authorUsername: data.authorUsername || '',
          authorDisplayName: data.authorDisplayName || '',
          authorProfileImage: data.authorProfileImage || '',
          authorBadge: data.authorBadge || '',
          authorIsVerified: data.authorIsVerified || false,
          caption: data.caption || '',
          mediaUrls: data.mediaUrls || '',
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
          repostCount: data.repostCount || 0,
          createdAt: data.createdAt?.seconds
            ? new Date(data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
            : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
        }
      })
      setPosts(result)
    } catch (err) {
      console.error('[Explore] Failed to search posts:', err)
      setPosts([])
    } finally {
      setPostsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrending()
    fetchSuggestions()
  }, [fetchTrending, fetchSuggestions])

  useEffect(() => {
    fetchCategoryPosts(activeCategory)
  }, [activeCategory, fetchCategoryPosts])

  const handleFollow = useCallback(async (targetId: string) => {
    if (!user || followedUsers.has(targetId)) return
    try {
      const { toggleFollow } = await import('@/lib/db')
      await toggleFollow(user.id, targetId)
      setFollowedUsers(prev => new Set(prev).add(targetId))
      toast.success('Followed!')
    } catch (err) {
      console.error('[Explore] Follow failed:', err)
    }
  }, [user, followedUsers])

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 bg-white/[0.06] rounded-full px-4 py-2.5 border border-white/[0.08] focus-within:border-[#FFFFFF]/50 transition-all">
          <svg className="w-5 h-5 text-[#94a3b8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search Black94"
            className="flex-1 bg-transparent text-[15px] text-[#e7e9ea] placeholder-[#64748b] outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#e7e9ea] text-black'
                : 'bg-white/[0.06] text-[#e7e9ea] hover:bg-white/[0.1]'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Trending Topics (only on trending tab) */}
      {activeCategory === 'trending' && (
        <div className="border-t border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-xl font-bold text-[#e7e9ea]">Trending Now</h3>
          </div>
          {trendingLoading ? (
            <div className="px-4 pb-3 space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 bg-white/[0.06] rounded" />
                    <div className="h-3 w-16 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M13 17h8m-8 0V9m0 8l-2-2m2 2l2-2M3 3l18 18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#e7e9ea] mb-1">No trending topics yet</h3>
              <p className="text-[14px] text-[#94a3b8]">Trending topics will appear as people post with hashtags.</p>
            </div>
          ) : (
            <div className="px-4 pb-3">
              {trendingTopics.map((topic, i) => (
                <button
                  key={topic.tag}
                  onClick={() => navigate('search', { q: topic.tag })}
                  className="w-full flex items-center gap-3 py-3 hover:bg-white/[0.03] transition-colors rounded-lg px-2"
                >
                  <span className="text-[14px] text-[#64748b] w-6 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[15px] font-bold text-[#e7e9ea]">{topic.tag}</p>
                    <p className="text-[13px] text-[#94a3b8]">{topic.count} {topic.count === 1 ? 'post' : 'posts'}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#64748b] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Who to follow */}
      <div className="px-4 py-4">
        <h3 className="text-lg font-bold text-[#e7e9ea] mb-3">Who to follow</h3>
        {suggestedLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/[0.06] shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-28 bg-white/[0.06] rounded" />
                  <div className="h-3 w-20 bg-white/[0.04] rounded" />
                </div>
                <div className="h-8 w-20 rounded-full bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2m22-6l-10 10M16 3l-8 8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[14px] text-[#94a3b8]">Suggestions will appear as more people join.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {suggestedUsers.map(su => (
              <div key={su.id} className="flex items-center gap-3 py-2 px-1">
                <button
                  onClick={() => navigate('user-profile', { userId: su.id })}
                  className="shrink-0"
                >
                  <PAvatar
                    src={su.profileImage}
                    name={su.displayName || su.username}
                    size={44}
                    verified={su.isVerified}
                    badge={su.badge}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate('user-profile', { userId: su.id })}
                    className="flex items-center gap-1 truncate"
                  >
                    <span className="text-[14px] font-bold text-[#e7e9ea] truncate hover:underline">
                      {su.displayName || su.username}
                    </span>
                    {su.isVerified && <VerifiedBadge size={14} badge={su.badge} />}
                  </button>
                  <p className="text-[13px] text-[#94a3b8] truncate">@{su.username}</p>
                </div>
                {followedUsers.has(su.id) ? (
                  <button className="px-4 py-1.5 rounded-full border border-[#64748b] text-[14px] font-bold text-[#e7e9ea]">
                    Following
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(su.id)}
                    className="px-4 py-1.5 rounded-full bg-[#e7e9ea] text-black text-[14px] font-bold hover:bg-gray-200 active:scale-[0.98] transition-all"
                  >
                    Follow
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category posts (below trending/suggestions) */}
      {activeCategory !== 'trending' && (
        <div className="border-t border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-lg font-bold text-[#e7e9ea] capitalize">{activeCategory}</h3>
          </div>
          {postsLoading ? (
            <div className="divide-y divide-white/[0.06]">
              {[0, 1, 2].map(i => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/[0.06] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 bg-white/[0.06] rounded" />
                      <div className="h-3 w-full bg-white/[0.04] rounded" />
                      <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-8">
              <p className="text-[14px] text-[#94a3b8]">No posts found for {activeCategory}. Be the first to post!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {posts.map(post => (
                <button
                  key={post.id}
                  onClick={() => navigate('user-profile', { userId: post.authorId })}
                  className="w-full px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-bold text-[#e7e9ea] truncate">
                      {post.authorDisplayName || post.authorUsername || 'User'}
                    </span>
                    <span className="text-[13px] text-[#94a3b8]">@{post.authorUsername}</span>
                    <span className="text-[13px] text-[#64748b]">·</span>
                    <span className="text-[13px] text-[#94a3b8]">{timeAgo(post.createdAt)}</span>
                  </div>
                  <p className="text-[14px] text-[#e7e9ea] line-clamp-2 leading-relaxed">{post.caption}</p>
                  {post.likeCount > 0 && (
                    <p className="text-[12px] text-[#64748b] mt-1.5">{post.likeCount} likes</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
