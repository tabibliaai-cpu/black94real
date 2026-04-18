'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, type AppView, type User as StoreUser } from '@/stores/app'
import { auth, authReady, signIn, signOutUser, onAuthStateChanged } from '@/lib/firebase'
import { createUserFromGoogle } from '@/lib/db'
import { type User as FirebaseUser } from 'firebase/auth'
import { FeedView } from '@/views/FeedView'
import { ExploreView } from '@/views/ExploreView'
import { ChatListView, ChatRoomView } from '@/views/ChatListView'
import { ProfileView } from '@/views/ProfileView'
import { NotificationsView } from '@/views/NotificationsView'
import { SearchView } from '@/views/SearchView'
import { SettingsView } from '@/views/SettingsView'
import { StoriesView } from '@/views/StoriesView'
import { AnonymousChatView, AnonymousChatRoomView } from '@/views/AnonymousChatView'
import { DualPaneChatView } from '@/views/DualPaneChatView'
import { BusinessDashboardView } from '@/views/BusinessDashboardView'
import { AdsManagerView } from '@/views/AdsManagerView'
import { CreateAdView } from '@/views/CreateAdView'
import { CrmLeadsView } from '@/views/CrmLeadsView'
import { CrmDealsView } from '@/views/CrmDealsView'
import { CrmOrdersView } from '@/views/CrmOrdersView'
import { CrmAnalyticsView } from '@/views/CrmAnalyticsView'
import { SubscriptionsView } from '@/views/SubscriptionsView'
import { PrivacySettingsView } from '@/views/PrivacySettingsView'
import { ShareProfileView } from '@/views/ShareProfileView'
import { WriteArticleView } from '@/views/WriteArticleView'
import { ArticleView } from '@/views/ArticleView'
import { AffiliatesView } from '@/views/AffiliatesView'
import { SalaryView } from '@/views/SalaryView'
import { PerformanceView } from '@/views/PerformanceView'
import { StoreView } from '@/views/StoreView'
import { StorefrontView } from '@/views/StorefrontView'
import { ProductDetailView } from '@/views/ProductDetailView'
import { CartView } from '@/views/CartView'
import { CheckoutView } from '@/views/CheckoutView'
import { MyStoreView } from '@/views/MyStoreView'
import { AddProductView } from '@/views/AddProductView'
import { OrderTrackingView } from '@/views/OrderTrackingView'
import { BusinessOrdersView } from '@/views/BusinessOrdersView'
import { useDualPaneChat } from '@/stores/dualPaneChat'
import { MobileNav } from '@/components/MobileNav'
import { MobileHeader } from '@/components/MobileHeader'
import { ComposeDialog } from '@/components/ComposeDialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH LOGIC — DO NOT TOUCH (LOCKED)
   ═══════════════════════════════════════════════════════════════════════════ */

type Screen = 'loading' | 'login' | 'app'

function toStoreUser(fb: FirebaseUser, db: Awaited<ReturnType<typeof createUserFromGoogle>>): StoreUser {
  return {
    id: fb.uid, email: fb.email ?? '', username: db.username,
    displayName: db.displayName || fb.displayName || '', bio: db.bio,
    profileImage: db.profileImage || fb.photoURL || '', coverImage: db.coverImage,
    role: db.role, badge: db.badge, subscription: db.subscription, isVerified: db.isVerified,
    accountType: db.role === 'business' ? 'business' : db.role === 'creator' ? 'creator' : 'personal',
    accountLocked: false, nameVisibility: db.nameVisibility, dmPermission: db.dmPermission,
    searchVisibility: db.searchVisibility, paidChatEnabled: db.paidChatEnabled,
    paidChatPrice: db.paidChatPrice, createdAt: db.createdAt,
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */

function LoginScreen({ onSignIn, busy }: { onSignIn: () => void; busy: boolean }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center px-6 max-w-[420px] w-full animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Black94" className="w-20 h-20 object-contain mb-5" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Black94</h1>
          <p className="text-sm text-[#71767b] mt-2 text-center">
            Connect, share, and grow with your community.
          </p>
        </div>

        <button
          onClick={onSignIn}
          disabled={busy}
          className="w-full max-w-[320px] h-[52px] rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-60 disabled:pointer-events-none"
        >
          {busy ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span className="text-[15px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
            {busy ? 'Signing in...' : 'Sign in with Google'}
          </span>
        </button>
        <p className="mt-6 text-[11px] text-[#536471] text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <img src="/logo.png" alt="Black94" className="w-14 h-14 object-contain animate-pulse" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT TABS — Segmented control for Chat / Chat Ads
   ═══════════════════════════════════════════════════════════════════════════ */

function ChatTabs() {
  const { activeTab, setActiveTab, totalEarned } = useDualPaneChat()

  return (
    <div className="flex items-center gap-[3px] p-[3px] rounded-full bg-white/[0.06] border border-white/[0.08]">
      <button
        onClick={() => setActiveTab('chat')}
        className={cn(
          'relative flex items-center gap-1.5 px-3.5 py-[5px] rounded-full text-[13px] font-semibold transition-all duration-300',
          activeTab === 'chat'
            ? 'bg-gradient-to-r from-[#a3d977] to-[#8cc65e] text-black shadow-md shadow-[#a3d977]/20'
            : 'text-[#71767b] hover:text-[#c0c0c0]'
        )}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Chat
      </button>
      <button
        onClick={() => setActiveTab('ads')}
        className={cn(
          'relative flex items-center gap-1.5 px-3.5 py-[5px] rounded-full text-[13px] font-semibold transition-all duration-300',
          activeTab === 'ads'
            ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-black shadow-md shadow-[#f59e0b]/20'
            : 'text-[#71767b] hover:text-[#c0c0c0]'
        )}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        Ads
        {totalEarned > 0 && (
          <span className={cn(
            'ml-0.5 text-[10px] font-bold px-1.5 py-[1px] rounded-full',
            activeTab === 'ads' ? 'bg-black/20 text-black' : 'bg-[#f59e0b]/15 text-[#f59e0b]'
          )}>
            ₹{totalEarned}
          </span>
        )}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIEW ROUTER
   ═══════════════════════════════════════════════════════════════════════════ */

function ViewRouter() {
  const currentView = useAppStore((s) => s.currentView)
  const views: Record<string, React.ReactNode> = {
    feed: <FeedView />,
    explore: <ExploreView />,
    chat: <ChatListView />,
    'chat-room': <ChatRoomView />,
    profile: <ProfileView />,
    'user-profile': <ProfileView />,
    'edit-profile': <SettingsView />,
    notifications: <NotificationsView />,
    search: <SearchView />,
    settings: <SettingsView />,
    stories: <StoriesView />,
    'anonymous-chat': <AnonymousChatView />,
    'anonymous-room': <AnonymousChatRoomView />,
    'dual-pane-chat': <DualPaneChatView />,
    'chat': <DualPaneChatView />,
    'subscriptions': <SubscriptionsView />,
    'business-dashboard': <BusinessDashboardView />,
    'ads-manager': <AdsManagerView />,
    'create-ad': <CreateAdView />,
    'crm-leads': <CrmLeadsView />,
    'crm-deals': <CrmDealsView />,
    'crm-orders': <CrmOrdersView />,
    'crm-analytics': <CrmAnalyticsView />,
    'privacy-settings': <PrivacySettingsView />,
    'share-profile': <ShareProfileView />,
    'write-article': <WriteArticleView />,
    'article': <ArticleView />,
    'affiliates': <AffiliatesView />,
    'salary': <SalaryView />,
    'performance': <PerformanceView />,
    'store': <StoreView />,
    'storefront': <StorefrontView />,
    'product-detail': <ProductDetailView />,
    'cart': <CartView />,
    'checkout': <CheckoutView />,
    'my-store': <MyStoreView />,
    'add-product': <AddProductView />,
    'order-tracking': <OrderTrackingView />,
    'business-orders': <BusinessOrdersView />,
  }
  return <>{views[currentView] || <FeedView />}</>
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Black94App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [busy, setBusy] = useState(false)
  const { user, setUser, setToken, navigate, currentView, composeOpen, setComposeOpen, logout } = useAppStore()

  /* ── Scroll-based header hide/show + FAB ──────────────────────────────── */
  const [headerState, setHeaderState] = useState<'visible' | 'hiding' | 'hidden'>('visible')
  const [fabVisible, setFabVisible] = useState(true)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const d = y - lastY.current

      if (y <= 0) {
        setHeaderState('visible')
        setFabVisible(true)
      } else if (d > 6) {
        setHeaderState('hiding')
        setFabVisible(false)
        clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = setTimeout(() => setHeaderState('hidden'), 180)
      } else if (d < -3) {
        setHeaderState('visible')
        setFabVisible(true)
        clearTimeout(scrollTimerRef.current)
      }

      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(scrollTimerRef.current) }
  }, [])

  /* ── Auth refs ────────────────────────────────────────────────────────── */
  const setUserRef = useRef(setUser)
  setUserRef.current = setUser
  const setTokenRef = useRef(setToken)
  setTokenRef.current = setToken
  const setScreenRef = useRef(setScreen)
  setScreenRef.current = setScreen
  const setBusyRef = useRef(setBusy)
  setBusyRef.current = setBusy

  /* ── Auth listener — DO NOT MODIFY ─────────────────────────────────────── */
  useEffect(() => {
    let dead = false
    let unsub: (() => void) | null = null

    const handleUser = async (fbUser: FirebaseUser) => {
      if (dead) return
      try {
        console.log('[Auth] Processing:', fbUser.uid, fbUser.email)
        const dbUser = await createUserFromGoogle(fbUser)
        if (dead) return
        const storeUser = toStoreUser(fbUser, dbUser)
        setUserRef.current(storeUser)
        setTokenRef.current(fbUser.uid)
        setScreenRef.current('app')
        setBusyRef.current(false)
        console.log('[Auth] Logged in:', storeUser.username)
      } catch (err) {
        console.error('[Auth] createUserFromGoogle failed:', err)
        setBusyRef.current(false)
        setScreenRef.current('login')
      }
    }

    authReady.then(() => {
      if (dead) return
      unsub = onAuthStateChanged(auth, (fbUser) => {
        if (dead) return
        if (fbUser) handleUser(fbUser)
        else { console.log('[Auth] No user — showing login'); setScreenRef.current('login') }
      })
    })

    return () => { dead = true; if (unsub) unsub() }
  }, [])

  /* ── Sign In ──────────────────────────────────────────────────────────── */
  const handleSignIn = useCallback(async () => {
    setBusy(true)
    try {
      console.log('[Auth] Opening popup...')
      const result = await signIn()
      if (result.user) {
        console.log('[Auth] Popup succeeded:', result.user.uid)
        setScreen('loading')
        const dbUser = await createUserFromGoogle(result.user)
        const storeUser = toStoreUser(result.user, dbUser)
        setUser(storeUser)
        setToken(result.user.uid)
        setScreen('app')
        setBusy(false)
      }
    } catch (err: unknown) {
      setBusy(false)
      const code = (err as { code?: string })?.code
      if (code === 'auth/popup-closed-by-user') return
      console.error('[Auth] signIn error:', err)
      toast.error('Sign in failed. Try again.')
    }
  }, [setUser, setToken])

  /* ── Sign Out ─────────────────────────────────────────────────────────── */
  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser()
      logout()
      setScreen('login')
      toast.success('Signed out')
    } catch {
      toast.error('Sign out failed')
    }
  }, [logout])

  /* ── Render ───────────────────────────────────────────────────────────── */

  if (screen === 'loading') return <LoadingScreen />
  if (screen === 'login') return <LoginScreen onSignIn={handleSignIn} busy={busy} />

  const showChrome = !['chat-room', 'edit-profile', 'anonymous-room', 'write-article', 'checkout'].includes(currentView)
  const isHomeFeed = currentView === 'feed'

  // Title for header
  const viewTitles: Record<string, string> = {
    search: 'Search',
    notifications: 'Notifications',
    settings: 'Settings',
    explore: 'Explore',
    stories: 'Stories',
    'anonymous-chat': 'Anonymous Chat',
    'subscriptions': 'Subscriptions',
    'business-dashboard': 'Business',
    'ads-manager': 'Ad Manager',
    'create-ad': 'Create Ad',
    'crm-leads': 'Leads',
    'crm-deals': 'Deals',
    'crm-orders': 'Orders',
    'crm-analytics': 'Analytics',
    'privacy-settings': 'Privacy',
    'share-profile': 'Share Profile',
    'write-article': 'Write Article',
    'article': 'Article',
    'affiliates': 'Affiliates',
    'salary': 'Salary',
    'performance': 'Performance',
    'store': 'Store',
    'storefront': 'Store',
    'product-detail': 'Product',
    'cart': 'Cart',
    'my-store': 'My Store',
    'add-product': 'Add Product',
    'order-tracking': 'My Orders',
    'business-orders': 'Orders',
  }

  const isDualPaneChat = currentView === 'dual-pane-chat' || currentView === 'chat'
  const headerTitle = isDualPaneChat ? undefined : viewTitles[currentView]

  return (
    <div className="min-h-screen bg-black">
      {/* ─── Header (scroll-hide/show on feed, always visible on other pages) ─── */}
      {showChrome && (
        <MobileHeader
          user={user ? { displayName: user.displayName || 'User', username: user.username, profileImage: user.profileImage } : null}
          showBack={!!headerTitle || isDualPaneChat}
          onBack={() => navigate('feed')}
          onProfileClick={() => navigate('profile')}
          onSettingsClick={() => navigate('settings')}
          onSignOut={handleSignOut}
          onLogoClick={() => navigate('feed')}
          headerState={isHomeFeed ? headerState : 'visible'}
          title={headerTitle}
          centerContent={isDualPaneChat ? <ChatTabs /> : undefined}
        />
      )}

      {/* ─── Views ─── */}
      <main><ViewRouter /></main>

      {/* ─── FAB — compose button ─── */}
      {isHomeFeed && (
        <button
          onClick={() => setComposeOpen(true)}
          className={cn(
            'fixed bottom-[62px] right-4 z-30 w-14 h-14 rounded-full bg-[#a3d977] flex items-center justify-center shadow-lg transition-all duration-300',
            'hover:bg-[#8cc65e] active:scale-90',
            fabVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
          )}
          aria-label="Create new post"
        >
          <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      {/* ─── Compose Dialog ─── */}
      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />

      {/* ─── Bottom Nav ─── */}
      {showChrome && (
        <MobileNav
          currentView={currentView}
          onNavigate={(view) => navigate(view as AppView)}
        />
      )}
    </div>
  )
}
