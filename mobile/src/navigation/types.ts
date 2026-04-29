import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

// ── Shared data types used across screens and components ─────────────────────

export interface Black94User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  role: 'personal' | 'creator' | 'professional' | 'business';
  badge: '' | 'blue' | 'gold';
  subscription: string;
  isVerified: boolean;
  nameVisibility: 'public' | 'private';
  dmPermission: 'all' | 'followers' | 'paid';
  searchVisibility: 'public' | 'private';
  paidChatEnabled: boolean;
  paidChatPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorBadge: string;
  authorIsVerified: boolean;
  caption: string;
  mediaUrls: string;
  factCheck: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentData {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  authorBadge: string;
  content: string;
  createdAt: string;
}

export interface StoryAuthor {
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  authorBadge: string;
  storyCount: number;
  hasUnseen: boolean;
}

export interface PostInteractionStatus {
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

// ── Navigation param lists ───────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ChatRoom: { chatId: string; otherUserId: string; otherUserName?: string; otherUserImage?: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  EditProfile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  CreatePost: undefined;
  StoryViewer: { storyIds: string; startIndex: number };
  StoryCreator: undefined;
  ArticleView: { articleId: string };
  WriteArticle: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  MyStore: undefined;
  AddProduct: undefined;
  Storefront: { userId: string };
  BusinessDashboard: undefined;
  CrmLeads: undefined;
  CrmDeals: undefined;
  CrmOrders: undefined;
  CrmAnalytics: undefined;
  AdsManager: undefined;
  CreateAd: undefined;
  PremiumDashboard: undefined;
  Affiliates: undefined;
  ShareProfile: undefined;
  AudioCall: { userId: string; userName?: string };
  OrderTracking: { orderId: string };
  Salary: undefined;
  Performance: undefined;
  Search: undefined;
  Bookmarks: undefined;
  Notifications: undefined;
  StoreDashboard: undefined;
  BusinessOrders: undefined;
  DualPaneChat: undefined;
  AnonymousChat: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Search: undefined;
  Chat: undefined;
  Notifications: undefined;
  Stories: undefined;
};

// ── Navigation prop helpers ──────────────────────────────────────────────────

export type FeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;
export type CreatePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreatePost'>;
export type UserProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
export type StoryViewerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoryViewer'>;

export type FeedScreenRouteProp = RouteProp<RootStackParamList, 'Main'>;
export type CreatePostScreenRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;
export type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
export type StoryViewerScreenRouteProp = RouteProp<RootStackParamList, 'StoryViewer'>;
