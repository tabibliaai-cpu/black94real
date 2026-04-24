'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { getUser, toggleFollow, getFollowerCount, getFollowingCount, checkIsFollowing } from '@/lib/db'
import { fetchUserPostsNoIndex, checkPostInteractions, togglePostLike, togglePostRepost, togglePostBookmark, fetchPostComments } from '@/lib/social'
import { deletePost } from '@/lib/db'
import { fetchBusinessProducts } from '@/lib/shop'
import { PAvatar, VerifiedBadge } from '@/components/PAvatar'
import { UserPostCard } from '@/components/UserPostCard'
import { ProductCard } from '@/components/ProductCard'
import type { Black94User } from '@/lib/db'
import { createOrGetChat } from '@/lib/chat'
import { toast } from 'sonner'

export function ProfileView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)

  const [profile, setProfile] = useState<Black94User | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'likes' | 'store'>('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [products, setProducts] = useState<any[]>([])
  const [messaging, setMessaging] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)

  // Replies & Likes tab state
  const [replies, setReplies] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<any[]>([])
  const [tabLoading, setTabLoading] = useState(false)

  const targetUserId = viewParams?.userId || user?.id
  const isOwnProfile = !viewParams?.userId || viewParams.userId === user?.id
  const isBusinessAccount = profile?.role === 'business'
  const showStoreTab = isBusinessAccount

  // Fetch profile + posts
  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      getUser(targetUserId),
      fetchUserPostsNoIndex(targetUserId, 20),
    ])
      .then(async ([u, p]) => {
        if (u) setProfile(u)
        // Check interaction status BEFORE rendering — no flash
        if (user && p.length > 0) {
          try {
            const postIds = p.map((post: any) => post.id)
            const statusMap = await checkPostInteractions(postIds, user.id)
            const enriched = p.map((post: any) => {
              const status = statusMap[post.id]
              if (!status) return post
              return { ...post, isLiked: status.isLiked, isReposted: status.isReposted, isBookmarked: status.isBookmarked }
            })
            setPosts(enriched)
          } catch (err) {
            console.error('Failed to check interactions:', err)
            setPosts(p)
          }
        } else {
          setPosts(p)
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err)
        setPosts([])
      })
      .finally(() => setLoading(false))
  }, [targetUserId, user])

  // Fetch products when store tab is active
  useEffect(() => {
    if (activeTab !== 'store' || !targetUserId) return
    setProductsLoading(true)
    fetchBusinessProducts(targetUserId, 20)
      .then(({ products: prods }) => setProducts(prods))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false))
  }, [activeTab, targetUserId])

  // Fetch replies when replies tab is active
  const fetchReplies = useCallback(async () => {
    if (!targetUserId) return
    setTabLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore')

      // Fetch recent comments by this user from post_comments collection
      const commentsRef = collection(db, 'post_comments')
      const q = query(
        commentsRef,
        where('authorId', '==', targetUserId),
        orderBy('createdAt', 'desc'),
        limit(30),
      )
      const snap = await getDocs(q)

      const replyList = snap.docs.map(docSnap => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          postId: d.postId || '',
          content: d.content || '',
          authorUsername: d.authorUsername || '',
          authorDisplayName: d.authorDisplayName || '',
          authorProfileImage: d.authorProfileImage || '',
          authorIsVerified: d.authorIsVerified || false,
          authorBadge: d.authorBadge || '',
          createdAt: d.createdAt?.seconds
            ? new Date(d.createdAt.seconds * 1000 + (d.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
            : (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()),
        }
      })

      setReplies(replyList)
    } catch (err) {
      console.error('[Profile] Failed to fetch replies:', err)
      setReplies([])
    } finally {
      setTabLoading(false)
    }
  }, [targetUserId])

  // Fetch liked posts when likes tab is active
  const fetchLikedPosts = useCallback(async () => {
    if (!targetUserId) return
    setTabLoading(true)
    try {
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore')

      // Get all likes by this user
      const likesRef = collection(db, 'post_likes')
      const q = query(likesRef, where('userId', '==', targetUserId))
      const snap = await getDocs(q)

      if (snap.empty) {
        setLikedPosts([])
        setTabLoading(false)
        return
      }

      const postIds = [...new Set(snap.docs.map(d => d.data().postId).filter(Boolean))]
      const CHUNK = 30
      const allPosts: any[] = []

      for (let i = 0; i < postIds.length; i += CHUNK) {
        const chunk = postIds.slice(i, i + CHUNK)
        try {
          const postsRef = collection(db, 'posts')
          const postQuery = query(postsRef, where('__name__', 'in', chunk))
          const postSnaps = await getDocs(postQuery)
          postSnaps.docs.forEach(ds => {
            const d = ds.data()
            allPosts.push({
              id: ds.id,
              authorId: d.authorId ?? '',
              authorUsername: d.authorUsername ?? '',
              authorDisplayName: d.authorDisplayName ?? '',
              authorProfileImage: d.authorProfileImage ?? '',
              authorBadge: d.authorBadge ?? '',
              authorIsVerified: d.authorIsVerified ?? false,
              caption: d.caption ?? '',
              mediaUrls: d.mediaUrls ?? '',
              likeCount: d.likeCount ?? 0,
              commentCount: d.commentCount ?? 0,
              repostCount: d.repostCount ?? 0,
              isLiked: targetUserId === user?.id,
              isReposted: false,
              isBookmarked: false,
              createdAt: d.createdAt?.seconds
                ? new Date(d.createdAt.seconds * 1000 + (d.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
                : (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()),
            })
          })
        } catch {
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
                  likeCount: d.likeCount ?? 0,
                  commentCount: d.commentCount ?? 0,
                  repostCount: d.repostCount ?? 0,
                  isLiked: targetUserId === user?.id,
                  isReposted: false,
                  isBookmarked: false,
                  createdAt: d.createdAt?.seconds
                    ? new Date(d.createdAt.seconds * 1000 + (d.createdAt.nanoseconds || 0) / 1_000_000).toISOString()
                    : (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()),
                })
              }
            } catch { /* skip */ }
          }
        }
      }

      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setLikedPosts(allPosts)
    } catch (err) {
      console.error('[Profile] Failed to fetch liked posts:', err)
      setLikedPosts([])
    } finally {
      setTabLoading(false)
    }
  }, [targetUserId, user?.id])

  // Load tab data when switching tabs
  useEffect(() => {
    if (activeTab === 'replies') fetchReplies()
    if (activeTab === 'likes') fetchLikedPosts()
  }, [activeTab, fetchReplies, fetchLikedPosts])

  const handleMessage = useCallback(async () => {
    if (!user || !targetUserId || targetUserId === user.id) return
    setMessaging(true)
    try {
      const chat = await createOrGetChat(user.id, targetUserId)
      navigate('chat-room', { chatId: chat.id })
    } catch (err) {
      console.error('Failed to start DM:', err)
      toast.error('Could not start message')
    } finally {
      setMessaging(false)
    }
  }, [user, targetUserId, navigate])

  const handleToggleFollow = useCallback(async () => {
    if (!user || !targetUserId || targetUserId === user.id) return
    try {
      const nowFollowing = await toggleFollow(user.id, targetUserId)
      setIsFollowing(nowFollowing)
    } catch (err) {
      console.error('Follow toggle failed:', err)
    }
  }, [user, targetUserId])

  const handleLike = useCallback(async (postId: string) => {
    if (!user) return
    try {
      await togglePostLike(postId, user.id)
      setPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likeCount: (p.likeCount ?? 0) + (p.isLiked ? -1 : 1) }
            : p
        )
      )
      setLikedPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likeCount: (p.likeCount ?? 0) + (p.isLiked ? -1 : 1) }
            : p
        )
      )
    } catch (err) {
      console.error('Like failed:', err)
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
      setLikedPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId
            ? { ...p, isReposted, repostCount: (p.repostCount ?? 0) + (isReposted ? 1 : -1) }
            : p
        )
      )
    } catch (err) {
      console.error('Repost failed:', err)
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
      setLikedPosts((prev) =>
        prev.map((p: any) =>
          p.id === postId ? { ...p, isBookmarked } : p
        )
      )
    } catch (err) {
      console.error('Bookmark failed:', err)
    }
  }, [user])

  const handleDelete = useCallback(async (postId: string) => {
    if (!user) return
    try {
      await deletePost(postId)
      setPosts((prev) => prev.filter((p: any) => p.id !== postId))
      toast.success('Post deleted')
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Delete failed')
    }
  }, [user])

  // Enrich ALL posts on this profile page with the profile's live data
  useEffect(() => {
    if (!profile || posts.length === 0) return
    setPosts((prev) => prev.map((p: any) => {
      return {
        ...p,
        authorProfileImage: profile.profileImage || p.authorProfileImage,
        authorIsVerified: profile.isVerified || p.authorIsVerified,
        authorBadge: profile.badge || p.authorBadge,
        authorDisplayName: profile.displayName || p.authorDisplayName,
        authorUsername: profile.username || p.authorUsername,
      }
    }))
  }, [profile?.profileImage, profile?.isVerified, profile?.badge, profile?.displayName, profile?.username])

  const displayName = profile?.displayName || (isOwnProfile ? user?.displayName : null) || 'User'
  const username = profile?.username || (isOwnProfile ? user?.username : null) || 'user'
  const bio = profile?.bio || (isOwnProfile ? user?.bio : null) || ''
  const profileImage = profile?.profileImage || (isOwnProfile ? user?.profileImage : '') || ''
  const coverImage = profile?.coverImage || (isOwnProfile ? user?.coverImage : '') || ''
  const isVerified = profile?.isVerified ?? (isOwnProfile ? user?.isVerified : false) ?? false
  const badge = profile?.badge || (isOwnProfile ? user?.badge : '') || ''

  useEffect(() => {
    if (!targetUserId) return
    Promise.all([
      getFollowerCount(targetUserId),
      getFollowingCount(targetUserId),
      ...(user && targetUserId !== user.id ? [checkIsFollowing(user.id, targetUserId)] : [Promise.resolve(false)]),
    ]).then(([followers, following, following_status]) => {
      setFollowerCount(followers)
      setFollowingCount(following)
      setIsFollowing(following_status)
    }).catch(() => {})
  }, [targetUserId, user?.id])

  // Helper: time ago
  const timeAgo = (dateStr?: string) => {
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-32 bg-white/[0.06] rounded-xl" />
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-white/[0.06] rounded" />
            <div className="h-4 w-48 bg-white/[0.06] rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Cover */}
      <div className="h-32 bg-[#000000] relative overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a2a1a] to-[#110f1a]" />
        )}
      </div>

      {/* Profile header */}
      <div className="px-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-end justify-between -mt-8 mb-3">
          <PAvatar
            src={profileImage}
            name={displayName}
            size={80}
            verified={isVerified}
            badge={badge}
            className="ring-4 ring-[#000000]"
          />
          {isOwnProfile ? (
            <button
              onClick={() => navigate('edit-profile')}
              className="px-5 py-1.5 rounded-full border border-[#64748b] text-[15px] font-bold text-[#e7e9ea] hover:bg-white/[0.06] transition-colors"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFollow}
                className={cn(
                  'px-6 py-2 rounded-full text-[15px] font-bold transition-colors',
                  isFollowing
                    ? 'border border-[#64748b] text-[#e7e9ea] hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                    : 'bg-[#e7e9ea] text-black hover:bg-gray-200'
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full border border-[#FFFFFF]/40 text-[15px] font-bold text-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {messaging ? (
                  <div className="w-4 h-4 border-2 border-[#FFFFFF]/30 border-t-[#FFFFFF] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                )}
                Message
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#e7e9ea]">{displayName}</h2>
          {(isVerified || !!badge) && <VerifiedBadge size={20} badge={badge} />}
        </div>
        <p className="text-[15px] text-[#94a3b8]">@{username}</p>
        {bio && (
          <p className="text-[15px] text-[#e7e9ea] mt-2 leading-relaxed">{bio}</p>
        )}

        <div className="flex items-center gap-5 mt-4 text-[14px]">
          <span className="text-[#e7e9ea]">
            <span className="font-bold">{followingCount}</span>{' '}
            <span className="text-[#94a3b8]">Following</span>
          </span>
          <span className="text-[#e7e9ea]">
            <span className="font-bold">{followerCount}</span>{' '}
            <span className="text-[#94a3b8]">Followers</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[53px] z-20 bg-[#000000] border-b border-white/[0.06]">
        <div className="flex">
          {(showStoreTab ? ['posts', 'store', 'likes'] : ['posts', 'replies', 'likes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3.5 text-[15px] font-medium relative transition-colors capitalize',
                activeTab === tab ? 'text-[#e7e9ea] font-bold' : 'text-[#94a3b8]'
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 inset-x-6 h-1 bg-[#FFFFFF] rounded-full animate-tab-indicator" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'replies' ? (
        tabLoading ? (
          <div className="divide-y divide-white/[0.06]">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 bg-white/[0.06] rounded" />
                    <div className="h-3 w-full bg-white/[0.04] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <svg className="w-12 h-12 text-[#64748b] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[15px] text-[#94a3b8]">No replies yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {replies.map(reply => (
              <div key={reply.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <PAvatar
                    src={reply.authorProfileImage || profileImage}
                    name={reply.authorDisplayName || reply.authorUsername}
                    size={32}
                    verified={reply.authorIsVerified}
                    badge={reply.authorBadge}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-[#e7e9ea] truncate">
                        {reply.authorDisplayName || reply.authorUsername}
                      </span>
                      <span className="text-[13px] text-[#94a3b8]">@{reply.authorUsername}</span>
                    </div>
                  </div>
                  <span className="text-[13px] text-[#64748b] shrink-0">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-[14px] text-[#e7e9ea] leading-relaxed mt-1 pl-11">{reply.content}</p>
                {reply.postId && (
                  <button
                    onClick={() => navigate('user-profile', { userId: reply.authorId })}
                    className="ml-11 mt-1.5 text-[13px] text-[#3b82f6] hover:underline"
                  >
                    View original post
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'likes' ? (
        tabLoading ? (
          <div className="divide-y divide-white/[0.06]">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-white/[0.06] rounded" />
                    <div className="h-3 w-full bg-white/[0.04] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : likedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <svg className="w-12 h-12 text-[#64748b] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[15px] text-[#94a3b8]">No liked posts yet</p>
          </div>
        ) : (
          likedPosts.map((post: any) => (
            <UserPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onRepost={handleRepost}
              onBookmark={handleBookmark}
              onProfileTap={(uid: string) => navigate('user-profile', { userId: uid })}
              userId={user?.id}
              userDisplayName={user?.displayName || undefined}
              userUsername={user?.username || undefined}
              userProfileImage={user?.profileImage || undefined}
            />
          ))
        )
      ) : activeTab === 'store' ? (
        <>
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-white/[0.06] aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <svg className="w-12 h-12 text-[#94a3b8] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6h18" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[15px] text-[#94a3b8]">No products listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-5">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {isOwnProfile && (
            <div className="flex flex-col items-center gap-3 pt-4 pb-24">
              <button
                onClick={() => navigate('add-product')}
                className="flex items-center gap-1.5 text-[13px] font-medium text-[#FFFFFF] hover:text-[#c4e899] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Product
              </button>
            </div>
          )}
        </>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-[15px] text-[#94a3b8]">No posts yet</p>
        </div>
      ) : (
        posts.map((post: any) => (
          <UserPostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onRepost={handleRepost}
            onBookmark={handleBookmark}
            onDelete={handleDelete}
            onProfileTap={(uid: string) => navigate('user-profile', { userId: uid })}
            userId={user?.id}
            userDisplayName={user?.displayName || undefined}
            userUsername={user?.username || undefined}
            userProfileImage={user?.profileImage || undefined}
          />
        ))
      )}
    </div>
  )
}
