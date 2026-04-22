import { create } from 'zustand'

/* ── Types ────────────────────────────────────────────────────────── */

export interface MessageReaction {
  emoji: string
  count: number
  reacted: boolean   // whether current user reacted
}

export interface ChatMsg {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  isMine: boolean
  read: boolean
  replyTo?: {           // which message this is replying to
    id: string
    senderName: string
    content: string
    isMine: boolean
  }
  reactions: MessageReaction[]
}

export interface SponsoredAd {
  id: string
  brandName: string
  brandInitial: string
  verified: boolean
  headline: string
  body: string
  imageUrl: string
  ctaText: string
  ctaColor: string
  reward: string
  impressions: number
  liked: boolean
  saved: boolean
  skipped: boolean
  timestamp: number
}

export interface MockChatItem {
  id: string
  name: string
  initial: string
  color: string
  online: boolean
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
  verified: boolean
  isMock: true
}

export type ChatView = 'list' | 'room' | 'settings'

interface DualPaneState {
  /* ── Layout ──────────────────────────────────── */
  activeTab: 'chat' | 'ads'
  chatWidthPercent: number
  adsCollapsed: boolean
  mobileAdsOpen: boolean
  isMobile: boolean

  /* ── Chat Navigation ─────────────────────────── */
  selectedChatId: string | null
  chatView: ChatView
  setChatView: (view: ChatView) => void
  selectChat: (chatId: string | null) => void

  /* ── Mock Chat List ──────────────────────────── */
  mockChatList: MockChatItem[]
  nuclearBlocked: Record<string, boolean>
  toggleNuclearBlock: (chatId: string) => void
  mutedChats: Record<string, boolean>
  toggleMute: (chatId: string) => void

  /* ── Chat Messages ────────────────────────────── */
  messages: ChatMsg[]
  setMessages: (msgs: ChatMsg[]) => void
  addMessage: (msg: ChatMsg) => void
  typing: boolean
  setTyping: (t: boolean) => void

  /* ── Reactions ───────────────────────────────── */
  toggleReaction: (msgId: string, emoji: string) => void

  /* ── Reply ───────────────────────────────────── */
  replyTo: ChatMsg | null
  setReplyTo: (msg: ChatMsg | null) => void

  /* ── Sponsored Ads ───────────────────────────── */
  ads: SponsoredAd[]
  loadMoreAds: () => void
  likedAds: Set<string>
  savedAds: Set<string>
  totalEarned: number

  /* ── Ad interactions ─────────────────────────── */
  likeAd: (id: string) => void
  saveAd: (id: string) => void
  skipAd: (id: string) => void
  clickCta: (id: string) => void

  /* ── Layout actions ──────────────────────────── */
  setActiveTab: (tab: 'chat' | 'ads') => void
  setChatWidth: (pct: number) => void
  toggleAdsCollapse: () => void
  setMobileAdsOpen: (open: boolean) => void
  setIsMobile: (m: boolean) => void
  reset: () => void
}

/* ── Mock chat messages ──────────────────────────────────────────── */

const MOCK_MESSAGES: Record<string, ChatMsg[]> = {
  'mock_sarah': [
    { id: 'm1', senderId: 'user_a', senderName: 'Sarah Chen', content: 'Hey! Are you coming to the event tonight?', timestamp: Date.now() - 3600000 * 2, isMine: false, read: true, reactions: [{ emoji: '🔥', count: 2, reacted: false }] },
    { id: 'm2', senderId: 'me', senderName: 'You', content: 'Yes! Definitely. What time does it start?', timestamp: Date.now() - 3600000 * 1.9, isMine: true, read: true, reactions: [] },
    { id: 'm3', senderId: 'user_a', senderName: 'Sarah Chen', content: 'Doors open at 7pm, main act at 8. I got us VIP spots 🎉', timestamp: Date.now() - 3600000 * 1.8, isMine: false, read: true, reactions: [{ emoji: '❤️', count: 1, reacted: true }, { emoji: '🎉', count: 3, reacted: true }] },
    { id: 'm4', senderId: 'me', senderName: 'You', content: "No way! That's amazing, thanks so much!", timestamp: Date.now() - 3600000 * 1.7, isMine: true, read: true, reactions: [{ emoji: '😂', count: 1, reacted: false }] },
    { id: 'm5', senderId: 'user_a', senderName: 'Sarah Chen', content: 'Of course! Also bring that playlist you showed me last week 🔥', timestamp: Date.now() - 3600000 * 1.5, isMine: false, read: true, reactions: [] },
    { id: 'm6', senderId: 'me', senderName: 'You', content: 'Already downloaded. The whole crew is going to love it.', timestamp: Date.now() - 3600000, isMine: true, read: true, reactions: [{ emoji: '💯', count: 2, reacted: true }] },
    { id: 'm7', senderId: 'user_a', senderName: 'Sarah Chen', content: "Perfect. I'll text you when I'm outside.", timestamp: Date.now() - 1800000, isMine: false, read: true, reactions: [] },
    { id: 'm8', senderId: 'user_a', senderName: 'Sarah Chen', content: 'Also did you see the new drop on Black94? Someone posted about the after-party', timestamp: Date.now() - 600000, isMine: false, read: true, reactions: [{ emoji: '👀', count: 1, reacted: false }] },
    { id: 'm9', senderId: 'me', senderName: 'You', content: 'No I missed that! Send me the link?', timestamp: Date.now() - 300000, isMine: true, read: true, reactions: [] },
  ],
  'mock_mike': [
    { id: 'mm1', senderId: 'user_b', senderName: 'Mike Dev', content: 'The API endpoint is ready for testing 🚀', timestamp: Date.now() - 7200000, isMine: false, read: true, reactions: [{ emoji: '🚀', count: 1, reacted: true }] },
    { id: 'mm2', senderId: 'me', senderName: 'You', content: 'Nice! Deploying to staging now.', timestamp: Date.now() - 6800000, isMine: true, read: true, reactions: [] },
    { id: 'mm3', senderId: 'user_b', senderName: 'Mike Dev', content: 'I found a bug in the auth middleware. Sending PR now.', timestamp: Date.now() - 3600000, isMine: false, read: true, reactions: [] },
    { id: 'mm4', senderId: 'me', senderName: 'You', content: 'Good catch. I will review it after lunch.', timestamp: Date.now() - 2400000, isMine: true, read: true, reactions: [{ emoji: '👍', count: 1, reacted: false }] },
    { id: 'mm5', senderId: 'user_b', senderName: 'Mike Dev', content: 'Sounds good. Also the client wants to add push notifications.', timestamp: Date.now() - 900000, isMine: false, read: true, reactions: [] },
  ],
  'mock_alex': [
    { id: 'am1', senderId: 'user_c', senderName: 'Alex Rivera', content: 'Just shipped the new design system! Check it out ✨', timestamp: Date.now() - 86400000, isMine: false, read: true, reactions: [{ emoji: '✨', count: 2, reacted: true }] },
    { id: 'am2', senderId: 'me', senderName: 'You', content: 'The dark mode variants look insane!', timestamp: Date.now() - 82800000, isMine: true, read: true, reactions: [] },
    { id: 'am3', senderId: 'user_c', senderName: 'Alex Rivera', content: 'Thanks! Spent 3 days on the color tokens alone lol', timestamp: Date.now() - 80000000, isMine: false, read: true, reactions: [{ emoji: '😂', count: 2, reacted: false }] },
    { id: 'am4', senderId: 'user_c', senderName: 'Alex Rivera', content: 'Want to collab on the motion design for the onboarding flow?', timestamp: Date.now() - 43200000, isMine: false, read: false, reactions: [] },
  ],
  'mock_priya': [
    { id: 'pm1', senderId: 'me', senderName: 'You', content: 'How was the conference?', timestamp: Date.now() - 172800000, isMine: true, read: true, reactions: [] },
    { id: 'pm2', senderId: 'user_d', senderName: 'Priya Sharma', content: 'Amazing! Met so many people from the AI community 🤖', timestamp: Date.now() - 170000000, isMine: false, read: true, reactions: [{ emoji: '🤖', count: 1, reacted: false }] },
    { id: 'pm3', senderId: 'user_d', senderName: 'Priya Sharma', content: 'There was this talk on RAG pipelines that blew my mind', timestamp: Date.now() - 168000000, isMine: false, read: true, reactions: [] },
    { id: 'pm4', senderId: 'me', senderName: 'You', content: 'Share the recording!', timestamp: Date.now() - 86400000, isMine: true, read: true, reactions: [] },
    { id: 'pm5', senderId: 'user_d', senderName: 'Priya Sharma', content: 'Will do! Also I started a new open source project. Want to contribute? 🛠️', timestamp: Date.now() - 7200000, isMine: false, read: false, reactions: [] },
  ],
  'mock_jordan': [
    { id: 'jm1', senderId: 'user_e', senderName: 'Jordan Lee', content: 'Bro the gym session was brutal today 💪', timestamp: Date.now() - 5400000, isMine: false, read: true, reactions: [{ emoji: '💪', count: 2, reacted: true }] },
    { id: 'jm2', senderId: 'me', senderName: 'You', content: 'New PR on deadlift?', timestamp: Date.now() - 4800000, isMine: true, read: true, reactions: [] },
    { id: 'jm3', senderId: 'user_e', senderName: 'Jordan Lee', content: 'Hit 405lbs! Finally broke the 4 plate barrier 🏆', timestamp: Date.now() - 4200000, isMine: false, read: true, reactions: [{ emoji: '🏆', count: 3, reacted: true }] },
    { id: 'jm4', senderId: 'me', senderName: 'You', content: 'That is legendary. We need to celebrate', timestamp: Date.now() - 3600000, isMine: true, read: true, reactions: [] },
    { id: 'jm5', senderId: 'user_e', senderName: 'Jordan Lee', content: "Let's hit the new ramen spot this weekend", timestamp: Date.now() - 1200000, isMine: false, read: false, reactions: [] },
  ],
  'mock_zara': [
    { id: 'zm1', senderId: 'user_f', senderName: 'Zara Kim', content: 'The marketing report is ready. Impressive growth numbers! 📈', timestamp: Date.now() - 259200000, isMine: false, read: true, reactions: [{ emoji: '📈', count: 1, reacted: false }] },
    { id: 'zm2', senderId: 'me', senderName: 'You', content: 'Great work! What is the CTR looking like?', timestamp: Date.now() - 250000000, isMine: true, read: true, reactions: [] },
    { id: 'zm3', senderId: 'user_f', senderName: 'Zara Kim', content: 'Up 340% from last quarter. The new ad creatives are performing really well.', timestamp: Date.now() - 240000000, isMine: false, read: true, reactions: [{ emoji: '🔥', count: 2, reacted: true }] },
    { id: 'zm4', senderId: 'me', senderName: 'You', content: 'Let us push more budget to those campaigns.', timestamp: Date.now() - 172800000, isMine: true, read: true, reactions: [] },
    { id: 'zm5', senderId: 'user_f', senderName: 'Zara Kim', content: "Already on it! Also planning the influencer partnership for next month. I'll send the deck.", timestamp: Date.now() - 14400000, isMine: false, read: true, reactions: [] },
  ],
}

/* ── Mock chat list data ──────────────────────────────────────────── */

const MOCK_CHAT_LIST: MockChatItem[] = [
  {
    id: 'mock_sarah',
    name: 'Sarah Chen',
    initial: 'S',
    color: '#D4A574',
    online: true,
    lastMessage: 'No I missed that! Send me the link?',
    lastMessageTime: Date.now() - 300000,
    unreadCount: 2,
    verified: true,
    isMock: true,
  },
  {
    id: 'mock_mike',
    name: 'Mike Dev',
    initial: 'M',
    color: '#9B7345',
    online: true,
    lastMessage: 'Also the client wants to add push notifications.',
    lastMessageTime: Date.now() - 900000,
    unreadCount: 1,
    verified: false,
    isMock: true,
  },
  {
    id: 'mock_alex',
    name: 'Alex Rivera',
    initial: 'A',
    color: '#f59e0b',
    online: false,
    lastMessage: 'Want to collab on the motion design?',
    lastMessageTime: Date.now() - 43200000,
    unreadCount: 1,
    verified: true,
    isMock: true,
  },
  {
    id: 'mock_jordan',
    name: 'Jordan Lee',
    initial: 'J',
    color: '#ef4444',
    online: true,
    lastMessage: "Let's hit the new ramen spot this weekend",
    lastMessageTime: Date.now() - 1200000,
    unreadCount: 0,
    verified: false,
    isMock: true,
  },
  {
    id: 'mock_priya',
    name: 'Priya Sharma',
    initial: 'P',
    color: '#D4A574',
    online: false,
    lastMessage: 'Want to contribute? 🛠️',
    lastMessageTime: Date.now() - 7200000,
    unreadCount: 3,
    verified: true,
    isMock: true,
  },
  {
    id: 'mock_zara',
    name: 'Zara Kim',
    initial: 'Z',
    color: '#2a7fff',
    online: false,
    lastMessage: "I'll send the deck.",
    lastMessageTime: Date.now() - 14400000,
    unreadCount: 0,
    verified: false,
    isMock: true,
  },
]

/* ── Mock sponsored ads ──────────────────────────────────────────── */

const MOCK_ADS: SponsoredAd[] = [
  {
    id: 'ad1', brandName: 'Nike', brandInitial: 'N', verified: true,
    headline: 'Just Do It — New Collection',
    body: 'Explore the latest Air Max lineup. Limited drops every week.',
    imageUrl: 'https://picsum.photos/seed/nike-ad/400/250',
    ctaText: 'Shop Now', ctaColor: '#f97316',
    reward: '₹2', impressions: 12400, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'ad2', brandName: 'Spotify', brandInitial: 'S', verified: true,
    headline: 'Your 2026 Wrapped is Here',
    body: 'See your top songs, artists, and podcasts of the year. Share your vibe.',
    imageUrl: 'https://picsum.photos/seed/spotify-ad/400/250',
    ctaText: 'Listen Now', ctaColor: '#10b981',
    reward: '₹1', impressions: 8900, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 7200000,
  },
  {
    id: 'ad3', brandName: 'Amazon', brandInitial: 'A', verified: true,
    headline: 'Mega Sale — Up to 70% OFF',
    body: 'Electronics, fashion, home & more. Deals go live at midnight.',
    imageUrl: 'https://picsum.photos/seed/amazon-ad/400/250',
    ctaText: 'Shop Deals', ctaColor: '#f59e0b',
    reward: '₹3', impressions: 24000, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 10800000,
  },
  {
    id: 'ad4', brandName: 'Samsung', brandInitial: 'S', verified: true,
    headline: 'Galaxy S26 Ultra — Pre-Order',
    body: '200MP camera. AI-powered editing. Titanium frame. Yours from ₹1,29,999.',
    imageUrl: 'https://picsum.photos/seed/samsung-ad/400/250',
    ctaText: 'Pre-Order', ctaColor: '#3b82f6',
    reward: '₹5', impressions: 15000, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 14400000,
  },
  {
    id: 'ad5', brandName: 'Zomato', brandInitial: 'Z', verified: true,
    headline: 'Free Delivery Weekend',
    body: 'Order from top restaurants near you. No delivery fee all weekend long!',
    imageUrl: 'https://picsum.photos/seed/zomato-ad/400/250',
    ctaText: 'Order Food', ctaColor: '#ef4444',
    reward: '₹2', impressions: 31000, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 18000000,
  },
  {
    id: 'ad6', brandName: 'Notion', brandInitial: 'N', verified: true,
    headline: 'Build Your Second Brain',
    body: 'Organize notes, tasks, and projects in one beautiful workspace.',
    imageUrl: 'https://picsum.photos/seed/notion-ad/400/250',
    ctaText: 'Try Free', ctaColor: '#D4A574',
    reward: '₹2', impressions: 6700, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 21600000,
  },
]

const EXTRA_ADS: SponsoredAd[] = [
  {
    id: 'ad7', brandName: 'Adobe', brandInitial: 'A', verified: true,
    headline: 'Creative Cloud — Student Offer',
    body: 'Get 60% off all Adobe apps. Design, edit, create — unlimited.',
    imageUrl: 'https://picsum.photos/seed/adobe-ad/400/250',
    ctaText: 'Get Offer', ctaColor: '#ef4444',
    reward: '₹3', impressions: 4200, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 25200000,
  },
  {
    id: 'ad8', brandName: 'Uber', brandInitial: 'U', verified: true,
    headline: 'Ride for ₹0 This Friday',
    body: 'First 2 rides absolutely free. Use code BLACK94 at checkout.',
    imageUrl: 'https://picsum.photos/seed/uber-ad/400/250',
    ctaText: 'Claim Ride', ctaColor: '#18152b',
    reward: '₹1', impressions: 19000, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 28800000,
  },
  {
    id: 'ad9', brandName: 'Netflix', brandInitial: 'N', verified: true,
    headline: 'New Releases This Week',
    body: 'Binge-worthy shows and movies added every day. Start watching now.',
    imageUrl: 'https://picsum.photos/seed/netflix-ad/400/250',
    ctaText: 'Watch Now', ctaColor: '#ef4444',
    reward: '₹2', impressions: 22000, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 32400000,
  },
  {
    id: 'ad10', brandName: 'LinkedIn', brandInitial: 'L', verified: true,
    headline: 'Your Profile Was Viewed 47 Times',
    body: 'Upgrade to Premium to see who viewed your profile and unlock top jobs.',
    imageUrl: 'https://picsum.photos/seed/linkedin-ad/400/250',
    ctaText: 'Go Premium', ctaColor: '#0a66c2',
    reward: '₹4', impressions: 9800, liked: false, saved: false, skipped: false,
    timestamp: Date.now() - 36000000,
  },
]

/* ════════════════════════════════════════════════════════════════════ */

export const useDualPaneChat = create<DualPaneState>((set, get) => ({
  /* ── Layout ──────────────────────────────────── */
  activeTab: 'chat' as 'chat' | 'ads',
  chatWidthPercent: 65,
  adsCollapsed: false,
  mobileAdsOpen: false,
  isMobile: false,

  /* ── Chat Navigation ─────────────────────────── */
  selectedChatId: null,
  chatView: 'list' as ChatView,
  setChatView: (view) => set({ chatView: view }),
  selectChat: (chatId) => {
    if (chatId) {
      const msgs = MOCK_MESSAGES[chatId] || MOCK_MESSAGES['mock_sarah']!
      set({ selectedChatId: chatId, chatView: 'room', messages: msgs })
    } else {
      set({ selectedChatId: null, chatView: 'list' })
    }
  },

  /* ── Mock Chat List ──────────────────────────── */
  mockChatList: MOCK_CHAT_LIST,
  nuclearBlocked: {},
  toggleNuclearBlock: (chatId) => set((s) => ({
    nuclearBlocked: { ...s.nuclearBlocked, [chatId]: !s.nuclearBlocked[chatId] },
  })),
  mutedChats: {},
  toggleMute: (chatId) => set((s) => ({
    mutedChats: { ...s.mutedChats, [chatId]: !s.mutedChats[chatId] },
  })),

  /* ── Chat Messages ────────────────────────────── */
  messages: MOCK_MESSAGES['mock_sarah']!,
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  typing: false,
  setTyping: (t) => set({ typing: t }),

  /* ── Reactions ───────────────────────────────── */
  toggleReaction: (msgId, emoji) => {
    set((s) => ({
      messages: s.messages.map((msg) => {
        if (msg.id !== msgId) return msg
        const existing = msg.reactions.find((r) => r.emoji === emoji)
        if (existing) {
          if (existing.reacted) {
            const newCount = existing.count - 1
            if (newCount <= 0) {
              return { ...msg, reactions: msg.reactions.filter((r) => r.emoji !== emoji) }
            }
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: newCount, reacted: false } : r
              ),
            }
          } else {
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r
              ),
            }
          }
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1, reacted: true }],
          }
        }
      }),
    }))
  },

  /* ── Reply ───────────────────────────────────── */
  replyTo: null,
  setReplyTo: (msg) => set({ replyTo: msg }),

  /* ── Sponsored Ads ───────────────────────────── */
  ads: MOCK_ADS,
  loadMoreAds: () => {
    const { ads } = get()
    if (ads.length >= MOCK_ADS.length + EXTRA_ADS.length) return
    const nextBatch = EXTRA_ADS.slice(0, 4)
    set((s) => ({
      ads: [...s.ads, ...nextBatch.filter((a) => !s.ads.find((ea) => ea.id === a.id))],
    }))
  },
  likedAds: new Set(),
  savedAds: new Set(),
  totalEarned: 0,

  /* ── Ad interactions ─────────────────────────── */
  likeAd: (id) => {
    const { ads, likedAds, totalEarned } = get()
    const isLiked = likedAds.has(id)
    const newLiked = new Set(likedAds)
    if (isLiked) newLiked.delete(id)
    else newLiked.add(id)
    const earned = isLiked ? -1 : 1
    set({
      likedAds: newLiked,
      totalEarned: totalEarned + earned,
      ads: ads.map((a) => (a.id === id ? { ...a, liked: !isLiked } : a)),
    })
  },

  saveAd: (id) => {
    const { ads, savedAds } = get()
    const isSaved = savedAds.has(id)
    const newSaved = new Set(savedAds)
    if (isSaved) newSaved.delete(id)
    else newSaved.add(id)
    set({
      savedAds: newSaved,
      ads: ads.map((a) => (a.id === id ? { ...a, saved: !isSaved } : a)),
    })
  },

  skipAd: (id) => {
    const { ads } = get()
    set({
      ads: ads.map((a) => (a.id === id ? { ...a, skipped: true } : a)),
    })
    setTimeout(() => {
      set((s) => ({ ads: s.ads.filter((a) => a.id !== id) }))
    }, 400)
  },

  clickCta: (id) => {
    const { ads, totalEarned } = get()
    const reward = parseInt(ads.find((a) => a.id === id)?.reward.replace(/[^\d]/g, '') || '0', 10) || 2
    set({
      totalEarned: totalEarned + reward,
      ads: ads.map((a) =>
        a.id === id ? { ...a, impressions: a.impressions + 1 } : a
      ),
    })
  },

  /* ── Layout actions ──────────────────────────── */
  setActiveTab: (tab) => set({ activeTab: tab }),
  setChatWidth: (pct) => set({ chatWidthPercent: Math.max(55, Math.min(85, pct)) }),
  toggleAdsCollapse: () => set((s) => ({ adsCollapsed: !s.adsCollapsed })),
  setMobileAdsOpen: (open) => set({ mobileAdsOpen: open }),
  setIsMobile: (m) => set({ isMobile: m }),

  reset: () => set({
    activeTab: 'chat' as 'chat' | 'ads',
    chatWidthPercent: 65,
    adsCollapsed: false,
    mobileAdsOpen: false,
    selectedChatId: null,
    chatView: 'list' as ChatView,
    messages: MOCK_MESSAGES['mock_sarah']!,
    typing: false,
    replyTo: null,
    ads: MOCK_ADS,
    likedAds: new Set(),
    savedAds: new Set(),
    totalEarned: 0,
  }),
}))
