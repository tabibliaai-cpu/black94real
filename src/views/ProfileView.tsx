'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { getUser, toggleFollow } from '@/lib/db'
import { fetchUserPostsNoIndex, checkPostInteractions, togglePostLike, togglePostRepost, togglePostBookmark } from '@/lib/social'
import { fetchBusinessProducts } from '@/lib/shop'
import { PAvatar } from '@/components/PAvatar'
import { UserPostCard } from '@/components/UserPostCard'
import { ProductCard } from '@/components/ProductCard'
import type { Black94User } from '@/lib/db'
import { getBusinessTrial, type BusinessTrial } from '@/lib/business'
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
  const [products, setProducts] = useState<any[]>([])
  const [messaging, setMessaging] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [trial, setTrial] = useState<BusinessTrial | null>(null)

  const targetUserId = viewParams?.userId || user?.id
  const isOwnProfile = !viewParams?.userId || viewParams.userId === user?.id
  const isBusinessAccount = profile?.role === 'business'
  const showStoreTab = isBusinessAccount

  // Fetch trial status for business accounts
  useEffect(() => {
    if (!targetUserId || !isBusinessAccount) return
    getBusinessTrial(targetUserId).then((t) => setTrial(t)).catch(() => {})
  }, [targetUserId, isBusinessAccount])

  // Fetch profile + posts
  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    Promise.all([
      getUser(targetUserId),
      fetchUserPostsNoIndex(targetUserId, 20),
    ])
      .then(([u, p]) => {
        if (u) setProfile(u)
        setPosts(p)
      })
      .catch((err) => {
        console.error('Failed to load profile:', err)
        setPosts([])
      })
      .finally(() => setLoading(false))
  }, [targetUserId])

  // Fetch products when store tab is active
  useEffect(() => {
    if (activeTab !== 'store' || !targetUserId) return
    setProductsLoading(true)
    fetchBusinessProducts(targetUserId, 20)
      .then(({ products: prods }) => setProducts(prods))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false))
  }, [activeTab, targetUserId])

  // Check interaction status for posts
  useEffect(() => {
    if (!user || posts.length === 0) return
    const postIds = posts.map((p: any) => p.id)
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
  }, [user, posts.length])

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
    } catch (err) {
      console.error('Bookmark failed:', err)
    }
  }, [user])

  const displayName = profile?.displayName || user?.displayName || 'User'
  const username = profile?.username || user?.username || 'user'
  const bio = profile?.bio || user?.bio || ''
  const profileImage = profile?.profileImage || user?.profileImage || ''
  const coverImage = profile?.coverImage || user?.coverImage || ''
  const isVerified = profile?.isVerified || user?.isVerified || false
  const followerCount = profile ? Math.floor(Math.random() * 500) + 50 : 0
  const followingCount = profile ? Math.floor(Math.random() * 300) + 20 : 0

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
      <div className="h-32 bg-[#1a1a1a] relative overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a2a1a] to-[#0a0a0a]" />
        )}
      </div>

      {/* Profile header */}
      <div className="px-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-end justify-between -mt-8 mb-3">
          <PAvatar
            src={profileImage}
            name={displayName}
            size={80}
            verified={isVerified}
            className="ring-4 ring-black"
          />
          {isOwnProfile ? (
            <button
              onClick={() => navigate('edit-profile')}
              className="px-5 py-1.5 rounded-full border border-[#536471] text-[15px] font-bold text-[#e8f0dc] hover:bg-white/[0.06] transition-colors"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFollow}
                className={cn(
                  'px-5 py-1.5 rounded-full text-[15px] font-bold transition-colors',
                  isFollowing
                    ? 'border border-[#536471] text-[#e8f0dc] hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                    : 'bg-[#e8f0dc] text-black hover:bg-gray-200'
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#a3d977]/40 text-[15px] font-bold text-[#a3d977] hover:bg-[#a3d977]/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {messaging ? (
                  <div className="w-4 h-4 border-2 border-[#a3d977]/30 border-t-[#a3d977] rounded-full animate-spin" />
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
          <h2 className="text-xl font-bold text-[#e8f0dc]">{displayName}</h2>
          {isBusinessAccount && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#a3d977]/15 text-[#a3d977]">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>
              Business
            </span>
          )}
        </div>
        <p className="text-[15px] text-[#71767b]">@{username}</p>
        {isBusinessAccount && trial && trial.isActive && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <svg className={cn('w-3.5 h-3.5', trial.daysRemaining <= 7 ? 'text-amber-400' : 'text-[#a3d977]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className={cn('text-[12px] font-medium', trial.daysRemaining <= 7 ? 'text-amber-400' : 'text-[#71767b]')}>
              Free Trial — {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} remaining
            </span>
          </div>
        )}

        {bio && (
          <p className="text-[15px] text-[#e8f0dc] mt-2 leading-relaxed">{bio}</p>
        )}

        <div className="flex items-center gap-4 mt-3 text-[14px]">
          <span className="text-[#e8f0dc]">
            <span className="font-bold">{followingCount}</span>{' '}
            <span className="text-[#71767b]">Following</span>
          </span>
          <span className="text-[#e8f0dc]">
            <span className="font-bold">{followerCount}</span>{' '}
            <span className="text-[#71767b]">Followers</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[53px] z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex">
          {(showStoreTab ? ['posts', 'store', 'likes'] : ['posts', 'replies', 'likes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3.5 text-[15px] font-medium relative transition-colors capitalize',
                activeTab === tab ? 'text-[#e8f0dc] font-bold' : 'text-[#71767b]'
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 inset-x-6 h-1 bg-[#a3d977] rounded-full animate-tab-indicator" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'store' ? (
        <>
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-3 p-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-white/[0.06] aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <svg className="w-12 h-12 text-[#71767b] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6h18" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[15px] text-[#71767b]">No products listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {isOwnProfile && (
            <div className="flex flex-col items-center gap-3 pt-4 pb-24">
              <button
                onClick={() => navigate('store-dashboard')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#a3d977] to-[#8cc65e] text-black font-bold text-[14px] shadow-lg shadow-[#a3d977]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Store Dashboard
              </button>
              <button
                onClick={() => navigate('add-product')}
                className="flex items-center gap-1.5 text-[13px] font-medium text-[#a3d977] hover:text-[#c4e899] transition-colors"
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
          <p className="text-[15px] text-[#71767b]">No posts yet</p>
        </div>
      ) : (
        posts.map((post: any) => (
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
      )}
    </div>
  )
}
