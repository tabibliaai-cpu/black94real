'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { fetchChats, sendMessage, fetchMessages } from '@/lib/db'
import { PAvatar } from '@/components/PAvatar'
import type { Chat, Message } from '@/lib/db'
import { useDualPaneChat, type SponsoredAd } from '@/stores/dualPaneChat'
import { toast } from 'sonner'

/* ── Helpers ───────────────────────────────────────────────────────── */

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function adTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

/* ═══════════════════════════════════════════════════════════════════════════
   VERIFIED BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.853-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.143.271.586.702 1.084 1.24 1.438.54.354 1.167.551 1.813.568.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.225 1.261.275 1.894.144.634-.13 1.219-.435 1.69-.882.445-.47.749-1.055.878-1.691.13-.634.084-1.292-.139-1.899.586-.272 1.084-.701 1.438-1.24.354-.542.551-1.172.57-1.82z" fill="#a3d977"/>
      <path d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#000"/>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SINGLE AD CARD (from DualPaneChatView)
   ═══════════════════════════════════════════════════════════════════════════ */

function AdCard({ ad }: { ad: SponsoredAd }) {
  const { likeAd, saveAd, skipAd, clickCta } = useDualPaneChat()

  return (
    <div className={cn(
      'mx-3 mb-3 rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] transition-all duration-400 animate-fade-in',
      ad.skipped && 'opacity-0 -translate-x-full h-0 mb-0 mx-0 overflow-hidden'
    )}>
      {/* Brand header */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a2a1a] to-[#0a0a0a] flex items-center justify-center text-[12px] text-[#a3d977] font-bold border border-white/[0.08]">
            {ad.brandInitial}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-white">{ad.brandName}</span>
              {ad.verified && <VerifiedBadge size={13} />}
            </div>
            <span className="text-[11px] text-[#536471]">Sponsored · {adTimeAgo(ad.timestamp)}</span>
          </div>
        </div>
        <button
          onClick={() => skipAd(ad.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5 text-[#536471]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Ad content */}
      <div className="px-3.5 pb-2">
        <p className="text-[14px] font-semibold text-white leading-snug">{ad.headline}</p>
        <p className="text-[13px] text-[#71767b] mt-1 leading-relaxed">{ad.body}</p>
      </div>

      {/* Ad image */}
      <div className="mx-3.5 mb-2.5 rounded-xl overflow-hidden aspect-[16/10] bg-white/[0.04]">
        <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* CTA Button */}
      <div className="px-3.5 pb-2">
        <button
          onClick={() => clickCta(ad.id)}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: ad.ctaColor }}
        >
          {ad.ctaText}
        </button>
      </div>

      {/* Bottom: reward + actions */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#536471]">Earn</span>
          <span className="text-[13px] font-bold text-[#f59e0b]">{ad.reward}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => likeAd(ad.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] transition-all duration-200',
              ad.liked ? 'bg-[#f91880]/15 text-[#f91880]' : 'text-[#71767b] hover:bg-white/[0.06]'
            )}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill={ad.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span>{ad.liked ? 'Liked' : 'Like'}</span>
          </button>
          <button
            onClick={() => saveAd(ad.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] transition-all duration-200',
              ad.saved ? 'bg-[#2a7fff]/15 text-[#2a7fff]' : 'text-[#71767b] hover:bg-white/[0.06]'
            )}
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill={ad.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            <span>{ad.saved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={() => skipAd(ad.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] text-[#71767b] hover:bg-white/[0.06] transition-all duration-200"
          >
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
            <span>Skip</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT ADS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function ChatAdsPanel() {
  const { ads, loadMoreAds, totalEarned } = useDualPaneChat()
  const [visibleCount, setVisibleCount] = useState(4)
  const scrollRef = useRef<HTMLDivElement>(null)

  const visibleAds = useMemo(() => ads.slice(0, visibleCount), [ads, visibleCount])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (scrollHeight - scrollTop - clientHeight < 120 && visibleCount < ads.length) {
      setVisibleCount((c) => Math.min(c + 3, ads.length))
      if (visibleCount >= ads.length - 1) loadMoreAds()
    }
  }, [visibleCount, ads.length, loadMoreAds])

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Ads Stats Bar */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20">
            <svg className="w-3.5 h-3.5 text-[#f59e0b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span className="text-[12px] font-bold text-[#f59e0b]">{ads.length} ads</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#f59e0b]/15 to-[#f97316]/15 border border-[#f59e0b]/20">
          <span className="text-[12px] text-[#f59e0b] font-semibold">Earned</span>
          <span className="text-[13px] font-bold text-[#f59e0b]">{totalEarned}</span>
        </div>
      </div>

      {/* Ads Feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2 no-scrollbar"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)' }}
      >
        {visibleAds.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}

        {visibleAds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[#536471]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <p className="text-[14px] text-[#71767b]">No more ads right now</p>
            <p className="text-[12px] text-[#536471] mt-1">Check back later for new sponsored content</p>
          </div>
        )}

        {visibleCount < ads.length && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-[#a3d977]/30 border-t-[#a3d977] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT LIST VIEW (with Chat + Chat Ads tabs)
   ═══════════════════════════════════════════════════════════════════════════ */

export function ChatListView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const currentView = useAppStore((s) => s.currentView)
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'ads'>('chat')

  const loadChats = useCallback(() => {
    if (!user) return
    setLoading(true)
    fetchChats(user.id)
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Re-fetch chats whenever user navigates back to the chat list
  useEffect(() => {
    if (currentView === 'chat') {
      loadChats()
    }
  }, [currentView, loadChats])

  return (
    <div className="flex flex-col h-[calc(100vh-90px)]">
      {/* ─── Tab Switcher ─── */}
      <div className="shrink-0 flex border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex-1 py-3 text-[15px] font-medium relative transition-colors',
            activeTab === 'chat' ? 'text-[#e8f0dc] font-bold' : 'text-[#71767b]'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className={cn('w-[18px] h-[18px]', activeTab === 'chat' ? 'text-[#a3d977]' : 'text-[#71767b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'chat' ? 2.2 : 1.8}>
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Chats
          </div>
          {activeTab === 'chat' && (
            <div className="absolute bottom-0 inset-x-8 h-[3px] bg-[#a3d977] rounded-full animate-tab-indicator" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={cn(
            'flex-1 py-3 text-[15px] font-medium relative transition-colors',
            activeTab === 'ads' ? 'text-[#e8f0dc] font-bold' : 'text-[#71767b]'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className={cn('w-[18px] h-[18px]', activeTab === 'ads' ? 'text-[#f59e0b]' : 'text-[#71767b]')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'ads' ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Chat Ads
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
              activeTab === 'ads'
                ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                : 'bg-white/[0.06] text-[#536471]'
            )}>
              NEW
            </span>
          </div>
          {activeTab === 'ads' && (
            <div className="absolute bottom-0 inset-x-8 h-[3px] bg-[#f59e0b] rounded-full animate-tab-indicator" />
          )}
        </button>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded bg-white/[0.06]" />
                      <div className="h-3 w-40 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#71767b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#e8f0dc] mb-1">No messages yet</h3>
                <p className="text-[15px] text-[#71767b]">Start a conversation to see messages here.</p>
              </div>
            ) : (
              <div>
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => navigate('chat-room', { chatId: chat.id })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="relative shrink-0">
                      <PAvatar
                        src={chat.otherUser?.profileImage}
                        name={chat.otherUser?.displayName}
                        size={48}
                      />
                      {chat.unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#a3d977] flex items-center justify-center">
                          <span className="text-[10px] font-bold text-black">{chat.unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 border-b border-white/[0.06] pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[15px] text-[#e8f0dc] truncate">
                          {chat.otherUser?.displayName || 'User'}
                        </span>
                        <span className="text-[13px] text-[#71767b] shrink-0 ml-2">
                          {timeAgo(chat.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={cn('text-[14px] truncate', chat.unreadCount > 0 ? 'text-[#e8f0dc] font-semibold' : 'text-[#71767b]')}>
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ChatAdsPanel />
        )}
      </div>
    </div>
  )
}

/* ── Chat Room ───────────────────────────────────────────────────────── */

export function ChatRoomView() {
  const user = useAppStore((s) => s.user)
  const viewParams = useAppStore((s) => s.viewParams)
  const navigate = useAppStore((s) => s.navigate)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const chatId = viewParams?.chatId
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    setLoading(true)
    fetchMessages(chatId, 50)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Resolve other user's ID and profile from the chat document
  const [otherId, setOtherId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<{ displayName: string; profileImage: string; username: string } | null>(null)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (!chatId || !user) return
    setChatLoading(true)
    import('firebase/firestore').then(({ getDoc, doc: docFn }) => {
      import('@/lib/firebase').then(({ db }) => {
        getDoc(docFn(db, 'chats', chatId)).then(async snap => {
          if (snap.exists()) {
            const data = snap.data()!
            const resolvedOtherId = data.user1Id === user.id ? data.user2Id : data.user1Id
            setOtherId(resolvedOtherId)
            // Fetch other user's profile
            try {
              const { getUser } = await import('@/lib/db')
              const otherProfile = await getUser(resolvedOtherId)
              if (otherProfile) {
                setOtherUser({
                  displayName: otherProfile.displayName,
                  profileImage: otherProfile.profileImage,
                  username: otherProfile.username,
                })
              }
            } catch (e) {
              console.error('Failed to fetch other user:', e)
            }
          }
          setChatLoading(false)
        }).catch(() => setChatLoading(false))
      })
    })
  }, [chatId, user])

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user || !chatId || sending || !otherId) return
    setSending(true)
    try {
      const msg = await sendMessage(chatId, user.id, otherId, text.trim())
      setMessages((prev) => [...prev, msg])
      setText('')
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }, [text, user, chatId, sending, otherId])

  return (
    <div className="flex flex-col h-[calc(100vh-90px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl shrink-0">
        <button
          onClick={() => navigate('chat')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
        >
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {chatLoading ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ) : otherUser ? (
          <>
            <PAvatar src={otherUser.profileImage} name={otherUser.displayName} size={36} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-[#e8f0dc] truncate">{otherUser.displayName}</p>
              <p className="text-[12px] text-[#71767b] truncate">@{otherUser.username}</p>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <p className="font-bold text-[15px] text-[#e8f0dc]">Chat</p>
          </div>
        )}
        <button
          onClick={() => navigate('audio-call', { chatName: otherUser?.displayName || 'User' })}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          aria-label="Audio call"
        >
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        </button>
        <button
          onClick={() => toast.info('Video call coming soon!')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          aria-label="Video call"
        >
          <svg className="w-5 h-5 text-[#e8f0dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#a3d977]/30 border-t-[#a3d977] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] text-[#71767b]">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed',
                    isMine ? 'bg-[#a3d977] text-black rounded-br-md' : 'bg-white/[0.08] text-[#e8f0dc] rounded-bl-md'
                  )}
                >
                  <p>{msg.content}</p>
                  <p className={cn('text-[11px] mt-1', isMine ? 'text-black/50' : 'text-[#71767b]')}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-white/[0.06] bg-black px-4 py-3 safe-area-bottom">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-white/[0.06] rounded-2xl border border-white/[0.08] focus-within:border-[#a3d977]/40 transition-colors px-4 py-2.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Start a message"
              className="w-full bg-transparent text-[15px] text-[#e8f0dc] placeholder-[#536471] outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !otherId || chatLoading}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0',
              text.trim() && !sending && otherId
                ? 'bg-[#a3d977] text-black hover:bg-[#8cc65e]'
                : 'bg-white/[0.06] text-[#536471]'
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
