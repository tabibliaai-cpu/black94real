/**
 * stores/app.ts — Global application state (Zustand)
 *
 * React Native version of the web app store.
 * Uses react-native-keychain for token persistence instead of localStorage.
 * Navigation state is managed by React Navigation — removed from this store.
 */

import { create } from 'zustand';
import * as Keychain from '../lib/keychain';

// ── Types ────────────────────────────────────────────────────────────────────

export type AccountType = 'personal' | 'creator' | 'professional' | 'business';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string;
  profileImage: string;
  coverImage: string;
  role: string;
  badge: string;
  subscription: string;
  isVerified: boolean;
  accountType: AccountType;
  accountLocked: boolean;
  nameVisibility: string;
  dmPermission: string;
  searchVisibility: string;
  paidChatEnabled: boolean;
  paidChatPrice: number;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
  sender?: { username: string; profileImage: string };
}

export interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  isPaidChat: boolean;
  chatPrice: number;
  isPaidBy: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  otherUser?: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Post {
  id: string;
  authorId: string;
  caption: string;
  mediaUrls: string;
  factCheck: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author?: User;
}

export interface Article {
  id: string;
  authorId: string;
  title: string;
  content: string;
  coverImage: string;
  factCheck: string;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  source: 'Ad' | 'Organic' | 'Referral' | 'Chat';
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  value: number;
  notes: string;
  aiScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Black94Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'repost' | 'engagement';
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorProfileImage: string;
  postId?: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  format: string;
  content: string;
  mediaUrl: string;
  language: string;
  pollOptions?: Array<{ id: string; text: string; votes: number; percentage: number }>;
  voiceUrl?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  festivalTemplate?: { id: string; name: string; gradient: string; emoji: string; textColor: string };
  cricketData?: { team1: string; team2: string; team1Score: string; team2Score: string; overs: string; venue: string; status: string };
  audience: string;
  expiry: string;
  viewCount: number;
  createdAt: string;
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  logout: () => void;

  // Chat
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  unreadChats: number;
  setUnreadChats: (count: number) => void;

  // Notifications
  unreadNotificationCount: number;
  setUnreadNotificationCount: (count: number) => void;

  // UI
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;

  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Feed refresh trigger (incremented after creating a post to reload feed)
  feedRefreshKey: number;
  triggerFeedRefresh: () => void;
}

// ── Initialize token from keychain (async, runs once on app start) ───────────

let _initialToken: string | null = null;
let _tokenLoaded = false;

/**
 * Call this early in the app lifecycle (e.g., App.tsx useEffect) to hydrate
 * the token from secure storage before the store is first accessed.
 */
export async function hydrateToken(): Promise<void> {
  try {
    _initialToken = await Keychain.getToken();
  } catch {
    _initialToken = null;
  }
  _tokenLoaded = true;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  token: null,
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  setToken: (token) => {
    // Persist to keychain (fire-and-forget)
    if (token) {
      Keychain.saveToken(token).catch((err) =>
        console.error('[store] Failed to persist token:', err),
      );
    } else {
      Keychain.deleteToken().catch((err) =>
        console.error('[store] Failed to delete token:', err),
      );
    }
    set({ token });
  },

  setUser: (user) => {
    // Persist user object to keychain (fire-and-forget)
    if (user) {
      Keychain.saveUser(user).catch((err) =>
        console.error('[store] Failed to persist user:', err),
      );
    } else {
      Keychain.deleteUser().catch((err) =>
        console.error('[store] Failed to delete user:', err),
      );
    }
    set({ user, isAuthenticated: !!user });
  },

  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  logout: () => {
    // Clear all persisted auth data
    Keychain.deleteToken().catch(() => {});
    Keychain.deleteUser().catch(() => {});
    set({ token: null, user: null, isAuthenticated: false, selectedChat: null, messages: [] });
  },

  // Chat
  selectedChat: null,
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  // Unread chats
  unreadChats: 0,
  setUnreadChats: (count) => set({ unreadChats: count }),

  // Notifications
  unreadNotificationCount: 0,
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),

  // UI
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  composeOpen: false,
  setComposeOpen: (open) => set({ composeOpen: open }),

  // Dark mode
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Feed refresh trigger
  feedRefreshKey: 0,
  triggerFeedRefresh: () =>
    set((state) => ({ feedRefreshKey: state.feedRefreshKey + 1 })),
}));
