'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PAvatar } from './PAvatar'
import { ExpandableText } from './ExpandableText'
import { CommentSheet } from './CommentSheet'
import { ShareMenu, RepostToast } from './ShareMenu'

interface UserPostCardProps {
  post: {
    id: string
    authorId: string
    authorUsername?: string
    authorDisplayName?: string
    authorProfileImage?: string
    authorIsVerified?: boolean
    authorBadge?: string
    caption?: string
    mediaUrls?: string
    likeCount?: number
    commentCount?: number
    repostCount?: number
    viewCount?: number
    createdAt?: string
    isLiked?: boolean
    isReposted?: boolean
    isBookmarked?: boolean
    comments?: Array<{
      id: string
      authorId: string
      authorUsername: string
      authorDisplayName: string
      authorProfileImage: string
      content: string
      createdAt: string
    }>
  }
  onLike?: (postId: string) => void
  onRepost?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onComment?: (postId: string) => void
  onProfileTap?: (userId: string) => void
  userId?: string
  userDisplayName?: string
  userUsername?: string
  userProfileImage?: string
}

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

function formatCount(n?: number): string {
  if (!n) return ''
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function highlightContent(text?: string) {
  if (!text) return null
  const parts = text.split(/(#\w+|@\w+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return <span key={i} className="text-[#8b5cf6] hover:underline cursor-pointer">{part}</span>
    }
    if (part.startsWith('@')) {
      return <span key={i} className="text-[#8b5cf6] hover:underline cursor-pointer">{part}</span>
    }
    return <span key={i}>{part}</span>
  })
}

export function UserPostCard({
  post,
  onLike,
  onRepost,
  onBookmark,
  onComment,
  onProfileTap,
  userId,
  userDisplayName,
  userUsername,
  userProfileImage,
}: UserPostCardProps) {
  /* ── Local interaction state (optimistic) ── */
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const [isReposted, setIsReposted] = useState(post.isReposted ?? false)
  const [repostCount, setRepostCount] = useState(post.repostCount ?? 0)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false)
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0)
  const [viewCount] = useState(post.viewCount ?? Math.floor(Math.random() * 5000 + 100))

  /* ── Sync local state with parent props (e.g., after Firestore check) ── */
  useEffect(() => { setIsLiked(post.isLiked ?? false) }, [post.isLiked])
  useEffect(() => { setLikeCount(post.likeCount ?? 0) }, [post.likeCount])
  useEffect(() => { setIsReposted(post.isReposted ?? false) }, [post.isReposted])
  useEffect(() => { setRepostCount(post.repostCount ?? 0) }, [post.repostCount])
  useEffect(() => { setIsBookmarked(post.isBookmarked ?? false) }, [post.isBookmarked])
  useEffect(() => { setCommentCount(post.commentCount ?? 0) }, [post.commentCount])

  /* ── Animation state ── */
  const [showHeart, setShowHeart] = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)
  const [repostAnim, setRepostAnim] = useState(false)
  const [bookmarkAnim, setBookmarkAnim] = useState(false)

  /* ── UI state ── */
  const [commentSheetOpen, setCommentSheetOpen] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  const lastTapRef = useRef(0)
  const likeTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const shareBtnRef = useRef<HTMLButtonElement>(null)

  const mediaUrls = post.mediaUrls
    ? post.mediaUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : []

  const comments = useMemo(() => post.comments ?? [], [post.comments])

  /* ── Handlers ── */

  const handleLike = useCallback(() => {
    const newVal = !isLiked
    setIsLiked(newVal)
    setLikeCount((c) => c + (newVal ? 1 : -1))
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 300)
    onLike?.(post.id)
  }, [isLiked, onLike, post.id])

  const handleRepost = useCallback(() => {
    const newVal = !isReposted
    setIsReposted(newVal)
    setRepostCount((c) => c + (newVal ? 1 : -1))
    setRepostAnim(true)
    setTimeout(() => setRepostAnim(false), 400)
    setToast({
      show: true,
      message: newVal ? 'Reposted' : 'Removed Repost',
    })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
    onRepost?.(post.id)
  }, [isReposted, onRepost, post.id])

  const handleBookmark = useCallback(() => {
    const newVal = !isBookmarked
    setIsBookmarked(newVal)
    setBookmarkAnim(true)
    setTimeout(() => setBookmarkAnim(false), 300)
    setToast({
      show: true,
      message: newVal ? 'Added to Bookmarks' : 'Removed from Bookmarks',
    })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
    onBookmark?.(post.id)
  }, [isBookmarked, onBookmark, post.id])

  const handleComment = useCallback(() => {
    setCommentSheetOpen(true)
    onComment?.(post.id)
  }, [onComment, post.id])

  // Double tap to like
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setIsLiked(true)
        setLikeCount((c) => c + 1)
        onLike?.(post.id)
      }
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 900)
      clearTimeout(likeTimeoutRef.current)
    }
    lastTapRef.current = now
  }, [isLiked, onLike, post.id])

  const handleQuote = useCallback(() => {
    setCommentSheetOpen(true)
  }, [])

  const handleCommentSent = useCallback(() => {
    setCommentCount((c) => c + 1)
  }, [])

  return (
    <>
      <article className="relative border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer px-4 py-3 rounded-none">
        {/* Double-tap heart overlay */}
        {showHeart && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <svg
              className="w-24 h-24 text-[#f91880] animate-heart-burst"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}

        {/* Repost indicator */}
        {isReposted && (
          <div className="flex items-center gap-1.5 ml-8 mb-0.5">
            <svg className="w-[14px] h-[14px] text-[#00ba7c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 11V9a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[12px] font-bold text-[#00ba7c]">You reposted</span>
          </div>
        )}

        <div className="flex gap-2.5">
          {/* Avatar */}
          <div className="shrink-0" onClick={() => onProfileTap?.(post.authorId)}>
            <PAvatar
              src={post.authorProfileImage}
              name={post.authorDisplayName}
              size={42}
              verified={post.authorIsVerified}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0" onClick={handleDoubleTap}>
            {/* Header row */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={(e) => { e.stopPropagation(); onProfileTap?.(post.authorId) }}
                className="font-bold text-[15px] text-[#f0eef6] hover:underline truncate"
              >
                {post.authorDisplayName || post.authorUsername || 'User'}
              </button>
              {post.authorIsVerified && (
                <svg className={cn('w-[18px] h-[18px] shrink-0')} viewBox="0 0 22 22" fill="none">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.853-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.271.586.702 1.084 1.24 1.438.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.225 1.261.275 1.894.144.634-.13 1.219-.435 1.69-.882.445-.47.749-1.055.878-1.691.13-.634.084-1.292-.139-1.899.586-.272 1.084-.701 1.438-1.24.354-.542.551-1.172.57-1.82z" fill={post.authorBadge === 'gold' ? '#ffd700' : post.authorBadge === 'pro' ? '#1d9bf0' : '#8b5cf6'}/>
                  <path d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#000"/>
                </svg>
              )}
              <span className="text-[#94a3b8] text-[15px]">@{post.authorUsername || 'user'}</span>
              <span className="text-[#94a3b8]">·</span>
              <span className="text-[#94a3b8] text-[15px] shrink-0">{timeAgo(post.createdAt)}</span>
            </div>

            {/* Caption — ExpandableText with line-clamp and Zustand state */}
            {post.caption && (
              <ExpandableText
                id={post.id}
                text={post.caption}
                maxLines={4}
                className="mt-1 text-[15px] leading-[22px] text-[#f0eef6]"
                renderContent={highlightContent}
              />
            )}

            {/* Media */}
            {mediaUrls.length > 0 && (
              <div
                className={cn(
                  'mt-3.5 rounded-2xl overflow-hidden border border-white/[0.06] max-h-[510px]',
                  mediaUrls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
                )}
              >
                {mediaUrls.slice(0, 4).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className={cn(
                      'w-full object-cover',
                      mediaUrls.length === 1 ? 'max-h-[510px]' : 'aspect-square'
                    )}
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between mt-3 max-w-[440px] -ml-2">
              {/* Reply / Comment */}
              <button
                className="flex items-center gap-1 group"
                onClick={(e) => { e.stopPropagation(); handleComment() }}
              >
                <div className="p-2.5 rounded-full group-hover:bg-[#8b5cf6]/10 transition-colors">
                  <svg className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {commentCount > 0 && (
                  <span className="text-[13px] text-[#94a3b8] group-hover:text-[#8b5cf6]">{formatCount(commentCount)}</span>
                )}
              </button>

              {/* Repost */}
              <button
                className="flex items-center gap-1 group"
                onClick={(e) => { e.stopPropagation(); handleRepost() }}
              >
                <div className="p-2.5 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                  <svg
                    className={cn(
                      'w-[18px] h-[18px] transition-colors',
                      isReposted ? 'text-[#00ba7c]' : 'text-[#94a3b8] group-hover:text-[#00ba7c]',
                      repostAnim && 'animate-like-bounce'
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 11V9a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {repostCount > 0 && (
                  <span className={cn('text-[13px]', isReposted ? 'text-[#00ba7c]' : 'text-[#94a3b8] group-hover:text-[#00ba7c]')}>
                    {formatCount(repostCount)}
                  </span>
                )}
              </button>

              {/* Like */}
              <button
                className="flex items-center gap-1 group"
                onClick={(e) => { e.stopPropagation(); handleLike() }}
              >
                <div className="p-2.5 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                  {isLiked ? (
                    <svg
                      className={cn('w-[18px] h-[18px] text-[#f91880]', likeAnim && 'animate-like-bounce')}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#f91880]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  )}
                </div>
                {likeCount > 0 && (
                  <span className={cn('text-[13px]', isLiked ? 'text-[#f91880]' : 'text-[#94a3b8] group-hover:text-[#f91880]')}>
                    {formatCount(likeCount)}
                  </span>
                )}
              </button>

              {/* Views */}
              <button className="flex items-center gap-1 group">
                <div className="p-2.5 rounded-full group-hover:bg-[#8b5cf6]/10 transition-colors">
                  <svg className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <span className="text-[13px] text-[#94a3b8]">{formatCount(viewCount)}</span>
              </button>

              {/* Bookmark + Share */}
              <div className="flex items-center">
                {/* Bookmark */}
                <button
                  className="group"
                  onClick={(e) => { e.stopPropagation(); handleBookmark() }}
                >
                  <div className="p-2.5 rounded-full group-hover:bg-[#8b5cf6]/10 transition-colors">
                    {isBookmarked ? (
                      <svg
                        className={cn('w-[18px] h-[18px] text-[#8b5cf6]', bookmarkAnim && 'animate-bookmark-pop')}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                      </svg>
                    )}
                  </div>
                </button>

                {/* Share */}
                <button
                  ref={shareBtnRef}
                  className="group"
                  onClick={(e) => { e.stopPropagation(); setShareMenuOpen(!shareMenuOpen) }}
                >
                  <div className="p-2.5 rounded-full group-hover:bg-[#8b5cf6]/10 transition-colors">
                    <svg className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Comment Sheet */}
      <CommentSheet
        open={commentSheetOpen}
        onClose={() => setCommentSheetOpen(false)}
        postId={post.id}
        postAuthor={post.authorDisplayName || post.authorUsername || 'User'}
        postCaption={post.caption}
        initialComments={comments}
        userId={userId}
        userDisplayName={userDisplayName}
        userUsername={userUsername}
        userProfileImage={userProfileImage}
        onCommentSent={handleCommentSent}
      />

      {/* Share Menu */}
      <ShareMenu
        open={shareMenuOpen}
        onClose={() => setShareMenuOpen(false)}
        onRepost={handleRepost}
        onQuote={handleQuote}
        isReposted={isReposted}
        anchorRef={shareBtnRef.current}
        postCaption={post.caption}
      />

      {/* Toast */}
      <RepostToast show={toast.show} message={toast.message} />
    </>
  )
}
