'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { getUser, toggleFollow } from '@/lib/db'
import { fetchUserPostsNoIndex, checkPostInteractions, togglePostLike, togglePostRepost, togglePostBookmark } from '@/lib/social'
import { PAvatar } from '@/components/PAvatar'
import { UserPostCard } from '@/components/UserPostCard'
import type { Black94User } from '@/lib/db'

export function ProfileView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const viewParams = useAppStore((s) => s.viewParams)

  const [profile, setProfile] = useState<Black94User | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'likes'>('posts')
  const [isFollowing, setIsFollowing] = useState(false)

  const targetUserId = viewParams?.userId || user?.id
  const isOwnProfile = !viewParams?.userId || viewParams.userId === user?.id

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
  }, [user, posts.length]) // eslint-disable-line react-hooks/exhaustive-deps

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
          )}
        </div>

        <h2 className="text-xl font-bold text-[#e8f0dc]">{displayName}</h2>
        <p className="text-[15px] text-[#71767b]">@{username}</p>

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
          {(['posts', 'replies', 'likes'] as const).map((tab) => (
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

      {/* Posts */}
      {posts.length === 0 ? (
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
