# Black94 — Project Memory

## Overview
- **Project Name**: Black94 Social Media App
- **Description**: A next-generation social media platform combining social networking, business tools, AI-powered CRM, content creation, and monetization features.
- **Firebase Project ID**: `black94`
- **Deployed URL**: https://black94.web.app
- **GitHub Repo**: https://github.com/tabibliaai-cpu/black94real
- **Project Directory**: `/home/z/my-project`

## Tech Stack
- **Framework**: Next.js 16.1.3 with Turbopack
- **Output Mode**: `output: "export"` (static site — no server-side rendering)
- **Language**: TypeScript (strict mode off, build errors skipped)
- **Styling**: Tailwind CSS 4, dark theme (`bg: #07060b`, cards: #100e18, accent: lime/green `#a3d977`)
- **Backend**: Firebase (Auth + Firestore + Hosting)
- **State Management**: Zustand (3 stores: `app.ts`, `anonymousChat.ts`, `dualPaneChat.ts`)
- **UI Components**: shadcn/ui (45 components)
- **Deployment**: Firebase Hosting via CLI (`firebase deploy --only hosting`)
- **Firebase Token**: Stored in session; deploy with `FIREBASE_TOKEN` env var

## Critical Rules — DO NOT VIOLATE
1. **NEVER modify `src/lib/firebase.ts`** — Firebase config and auth initialization
2. **NEVER modify `src/lib/auth.ts`** — Authentication utilities
3. **NEVER modify `src/lib/db.ts`** — Core data layer (users, posts, chats, notifications)
4. **NEVER modify `src/lib/utils.ts`** — Utility functions
5. **NEVER recreate the project from scratch**
6. **NEVER delete existing files**
7. **NEVER change Google Auth configuration**
8. **NEVER change Firebase config values (apiKey, authDomain, projectId, etc.)**

## Architecture

### File Structure
```
src/
├── app/
│   └── page.tsx          # Main shell: auth guard, view router, login screen
├── components/
│   ├── UserPostCard.tsx   # Post card with like/comment/repost/bookmark
│   ├── CommentSheet.tsx   # Comments bottom sheet
│   ├── ComposeDialog.tsx  # New post composition
│   ├── MobileNav.tsx      # Bottom navigation (7 tabs)
│   ├── MobileHeader.tsx   # Top header with back/settings
│   ├── ChatSettingsSheet.tsx
│   ├── ShareMenu.tsx
│   ├── PAvatar.tsx        # Profile avatar with verified badge
│   └── ui/                # 45 shadcn/ui components
├── lib/
│   ├── firebase.ts        # [LOCKED] Firebase config, auth, Google provider
│   ├── auth.ts            # [LOCKED] Password hashing, JWT utilities
│   ├── db.ts              # [LOCKED] Firestore CRUD: users, posts, chats, messages, notifications
│   ├── social.ts          # Post interactions: likes, comments, reposts, bookmarks
│   ├── articles.ts        # Article CRUD (save/get/generate ID)
│   ├── privacy.ts         # Share link generation, expiry
│   ├── subscription.ts    # Plan definitions (Free/Pro/Gold), billing mock
│   ├── business.ts        # Business mock data (team, payroll, campaigns)
│   ├── crm.ts             # CRM mock data (leads, deals, orders, analytics, ads)
│   └── utils.ts           # [LOCKED] cn() utility (clsx + twMerge)
├── stores/
│   ├── app.ts             # Main store: user, navigation, UI state (AppView union)
│   ├── anonymousChat.ts   # Anonymous chat state
│   └── dualPaneChat.ts    # Dual-pane chat + ads state
└── views/                 # 25 views (see below)
```

### Navigation System
- **Client-side routing** via Zustand `currentView` state (no React Router)
- `page.tsx` contains a `ViewRouter` component that maps view names to React components
- `MobileNav.tsx` provides 7 bottom tabs: Home, Stories, Anon, Search, Notifications, Chat, Profile
- Settings page (gear icon) provides navigation to all other features

### Views (25 total, all fully implemented)
| View | File | Purpose |
|------|------|---------|
| Feed | `FeedView.tsx` | Main feed with posts, infinite scroll, pull-to-refresh |
| Explore | `ExploreView.tsx` | Category pills, trending topics, suggested users |
| Chat List | `ChatListView.tsx` | Firestore-based chat list with rooms |
| Chat Room | `ChatRoomView.tsx` | Individual chat room |
| Dual Pane Chat | `DualPaneChatView.tsx` | Split-pane chat + ads, reactions, E2EE badge, reply |
| Profile | `ProfileView.tsx` | User profile with posts, follow/unfollow |
| User Profile | `ProfileView.tsx` | Other user profiles (navigated with userId param) |
| Settings | `SettingsView.tsx` | Feature hub: edit profile + links to all features |
| Search | `SearchView.tsx` | Firestore search for users and posts |
| Notifications | `NotificationsView.tsx` | Real-time notifications from Firestore |
| Stories | `StoriesView.tsx` | Full-screen story viewer with auto-advance |
| Anonymous Chat | `AnonymousChatView.tsx` | Anonymous matching lobby + chat rooms |
| Anonymous Room | `AnonymousChatRoomView.tsx` | Anonymous chat room |
| Subscriptions | `SubscriptionsView.tsx` | Free/Pro/Gold plans, pricing, billing history |
| Privacy Settings | `PrivacySettingsView.tsx` | Name visibility, DM permissions, paid chat, nuclear block |
| Share Profile | `ShareProfileView.tsx` | QR code, 5-min expiring link, social sharing |
| Write Article | `WriteArticleView.tsx` | Article editor with fact-check, word count, cover image |
| Article View | `ArticleView.tsx` | Article display with fact-check badge, engagement |
| Affiliates | `AffiliatesView.tsx` | Badge management, affiliate purchase flow |
| Business Dashboard | `BusinessDashboardView.tsx` | Revenue chart, quick stats, AI insights |
| Ad Manager | `AdsManagerView.tsx` | Campaign stats, impressions, toggle active/paused |
| Create Ad | `CreateAdView.tsx` | Full ad form with targeting, budget, live preview |
| CRM Leads | `CrmLeadsView.tsx` | Lead pipeline with AI scores, Hot/Warm/Cold tabs |
| CRM Deals | `CrmDealsView.tsx` | Kanban board with 6 deal stages |
| CRM Orders | `CrmOrdersView.tsx` | Order list with status icons |
| CRM Analytics | `CrmAnalyticsView.tsx` | KPI cards, revenue chart, pie chart, AI recommendations |
| Salary | `SalaryView.tsx` | Team salary management, commission, payroll |
| Performance | `PerformanceView.tsx` | Campaign performance, channel comparison, A/B tests |

## Firestore Data Structure

### Collections
| Collection | Document ID | Fields |
|------------|-------------|--------|
| `users` | `{uid}` | uid, email, username, usernameLower, displayName, bio, profileImage, coverImage, role, badge, subscription, isVerified, nameVisibility, dmPermission, searchVisibility, paidChatEnabled, paidChatPrice, createdAt, updatedAt |
| `usernames` | `{usernameLower}` | uid |
| `posts` | `{auto}` | authorId, authorUsername, authorDisplayName, authorProfileImage, authorBadge, authorIsVerified, caption, mediaUrls, factCheck, likeCount, commentCount, repostCount, createdAt, updatedAt |
| `post_likes` | `{postId}_{userId}` | postId, userId, createdAt |
| `post_comments` | `{auto}` | postId, authorId, authorUsername, authorDisplayName, authorProfileImage, content, createdAt |
| `post_reposts` | `{postId}_{userId}` | postId, userId, createdAt |
| `post_bookmarks` | `{postId}_{userId}` | postId, userId, createdAt |
| `follows` | `{followerId}_{followingId}` | followerId, followingId, createdAt |
| `chats` | `{auto}` | user1Id, user2Id, isPaidChat, chatPrice, isPaidBy, isDeleted, unreadCount, createdAt, updatedAt |
| `chats/{chatId}/messages` | `{auto}` | chatId, senderId, receiverId, content, messageType, mediaUrl, status, createdAt |
| `notifications` | `{auto}` | userId, type, actorId, actorName, actorUsername, actorProfileImage, postId, message, read, createdAt |

### Interaction System
- **social.ts** uses top-level collections (`post_likes`, `post_comments`, `post_reposts`, `post_bookmarks`)
- **db.ts** has duplicate functions using subcollections (`posts/{postId}/likes/`) — DO NOT USE these, they are in the locked file
- All interaction checks happen via `checkPostInteractions()` in `social.ts`
- Like/comment counts are stored on the post document AND in separate collections

## Deployment
```bash
# Build
npx next build

# Deploy hosting
export FIREBASE_TOKEN="YOUR_TOKEN"
npx firebase deploy --only hosting --project black94

# Deploy Firestore rules
npx firebase deploy --only firestore:rules --project black94
```

## Known Issues
1. ~~Reaction buttons (likes/comments/reposts) not persisting~~ — Fixed with Firestore rules deployment
2. Some views (Business Dashboard, CRM, Ads) use mock data from `business.ts` and `crm.ts` — these need to be migrated to real Firestore queries
3. No server-side API routes (static export only) — all logic runs client-side

## Feature Categories
1. **Social**: Feed, posts, likes, comments, reposts, bookmarks, search, notifications
2. **Messaging**: 1-on-1 chat (Firestore), dual-pane chat with ads, anonymous chat
3. **Privacy**: Nuclear block, name visibility, DM permissions, paid chat, expiring profile sharing
4. **Content**: Article creation with fact-checking
5. **Monetization**: Subscriptions (Free/Pro/Gold), affiliate badges
6. **Business**: Ad creation/management, business dashboard
7. **AI CRM**: Leads, deals, orders, analytics (currently mock data)
8. **Team**: Salary management, performance tracking (currently mock data)
