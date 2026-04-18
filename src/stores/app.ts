import { create } from 'zustand'

export type AppView = 
  | 'landing' | 'login' | 'signup' | 'feed' | 'explore' | 'chat' 
  | 'chat-room' | 'e2ee-chat' | 'profile' | 'edit-profile' | 'article' | 'write-article'
  | 'notifications' | 'search' | 'settings' | 'business-dashboard' 
  | 'ads-manager' | 'create-ad' | 'crm-leads' | 'crm-deals' | 'crm-orders'
  | 'crm-analytics' | 'affiliates' | 'subscriptions' | 'share-profile'
  | 'user-profile' | 'threads' | 'thread-detail'
  | 'anonymous-chat' | 'anonymous-room' | 'reels' | 'stories' | 'dual-pane-chat'
  | 'storefront' | 'product-detail' | 'cart' | 'checkout'
  | 'my-store' | 'add-product' | 'order-tracking' | 'business-orders'

export type AccountType = 'personal' | 'creator' | 'professional' | 'business'

export interface User {
  id: string
  email: string
  username: string
  displayName: string | null
  bio: string
  profileImage: string
  coverImage: string
  role: string
  badge: string
  subscription: string
  isVerified: boolean
  accountType: AccountType
  accountLocked: boolean // true once switched to business — cannot go back
  nameVisibility: string
  dmPermission: string
  searchVisibility: string
  paidChatEnabled: boolean
  paidChatPrice: number
  createdAt: string
  followerCount?: number
  followingCount?: number
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  receiverId: string
  content: string
  messageType: string
  mediaUrl: string | null
  status: string
  createdAt: string
  sender?: { username: string; profileImage: string }
}

export interface Chat {
  id: string
  user1Id: string
  user2Id: string
  isPaidChat: boolean
  chatPrice: number
  isPaidBy: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  otherUser?: User
  lastMessage?: Message
  unreadCount?: number
}

export interface Post {
  id: string
  authorId: string
  caption: string
  mediaUrls: string
  factCheck: string
  createdAt: string
  updatedAt: string
  author?: User
  likeCount?: number
  commentCount?: number
  isLiked?: boolean
  comments?: Comment[]
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: string
  author?: User
}

export interface Article {
  id: string
  authorId: string
  title: string
  content: string
  coverImage: string
  factCheck: string
  isPublished: boolean
  views: number
  createdAt: string
  updatedAt: string
  author?: User
}

export interface Lead {
  id: string
  businessId: string
  name: string
  email: string
  phone: string
  source: 'Ad' | 'Organic' | 'Referral' | 'Chat'
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost'
  value: number
  notes: string
  aiScore: number
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface ThreadReply {
  id: string
  content: string
  authorId: string
  author?: User
  createdAt: string
}

export interface Thread {
  id: string
  chatId: string
  originalMessageId: string
  originalMessage: Message
  replies: ThreadReply[]
  createdAt: string
  updatedAt: string
}

export interface ChatAd {
  id: string
  advertiserName: string
  headline: string
  body: string
  ctaText: string
  ctaUrl: string
  imageUrl: string
  revenue: number
  impressions: number
  clicks: number
  createdAt: string
}

export interface AnonymousMessage {
  id: string
  roomId: string
  nickname: string
  content: string
  createdAt: string
}

interface AppState {
  // Auth
  token: string | null
  user: User | null
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  logout: () => void

  // Navigation
  currentView: AppView
  viewParams: Record<string, string>
  navigate: (view: AppView, params?: Record<string, string>) => void
  previousView: AppView

  // Chat
  selectedChat: Chat | null
  setSelectedChat: (chat: Chat | null) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void

  // UI
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
  fabVisible: boolean
  setFabVisible: (visible: boolean) => void
  composeOpen: boolean
  setComposeOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  token: typeof window !== 'undefined' ? localStorage.getItem('black94_token') : null,
  user: null,
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('black94_token', token)
      else localStorage.removeItem('black94_token')
    }
    set({ token })
  },
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('black94_token')
    set({ token: null, user: null, currentView: 'landing' })
  },

  // Navigation
  currentView: 'landing',
  viewParams: {},
  previousView: 'landing',
  navigate: (view, params = {}) => {
    const prev = get().currentView
    set({ currentView: view, viewParams: params, previousView: prev })
  },

  // Chat
  selectedChat: null,
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  // UI
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isDarkMode: typeof window !== 'undefined' 
    ? document.documentElement.classList.contains('dark') 
    : false,
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', newMode)
    }
    return { isDarkMode: newMode }
  }),
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  fabVisible: true,
  setFabVisible: (visible) => set({ fabVisible: visible }),
  composeOpen: false,
  setComposeOpen: (open) => set({ composeOpen: open }),
}))
