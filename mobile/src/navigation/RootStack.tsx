import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import MainTabs from './MainTabs';
import AuthNavigator from './AuthNavigator';
import { Colors, Spacing } from '../theme';

// ── Screen imports ─────────────────────────────────────────────────────────
// Chat
import ChatRoomScreen from '../screens/ChatRoomScreen';
import DualPaneChatScreen from '../screens/DualPaneChatScreen';
import AnonymousChatScreen from '../screens/AnonymousChatScreen';
import AudioCallScreen from '../screens/AudioCallScreen';

// Profile
import ProfileScreen from '../screens/ProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import ShareProfileScreen from '../screens/ShareProfileScreen';

// Posts & Stories
import StoryViewerScreen from '../screens/StoryViewerScreen';
import StoryCreatorScreen from '../screens/StoryCreatorScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ExploreScreen from '../screens/ExploreScreen';

// Articles
import ArticleViewScreen from '../screens/ArticleViewScreen';
import WriteArticleScreen from '../screens/WriteArticleScreen';

// Marketplace / Store
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import MyStoreScreen from '../screens/MyStoreScreen';
import AddProductScreen from '../screens/AddProductScreen';
import StorefrontScreen from '../screens/StorefrontScreen';
import StoreDashboardScreen from '../screens/StoreDashboardScreen';
import BusinessOrdersScreen from '../screens/BusinessOrdersScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';

// Business / CRM
import BusinessDashboardScreen from '../screens/BusinessDashboardScreen';
import CrmLeadsScreen from '../screens/CrmLeadsScreen';
import CrmDealsScreen from '../screens/CrmDealsScreen';
import CrmOrdersScreen from '../screens/CrmOrdersScreen';
import CrmAnalyticsScreen from '../screens/CrmAnalyticsScreen';

// Ads
import AdsManagerScreen from '../screens/AdsManagerScreen';
import CreateAdScreen from '../screens/CreateAdScreen';

// Premium & Affiliates
import PremiumDashboardScreen from '../screens/PremiumDashboardScreen';
import AffiliatesScreen from '../screens/AffiliatesScreen';

// Employer / Salary
import SalaryScreen from '../screens/SalaryScreen';
import PerformanceScreen from '../screens/PerformanceScreen';

// Misc
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BookmarksScreen from '../screens/BookmarksScreen';

// ─── Placeholder for screens that don't have real implementations yet ──────
function PlaceholderScreen({
  route,
}: {
  route: { params?: Record<string, unknown> };
}) {
  const title =
    (route.params?.screenName as string) ?? 'Screen';
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSubtext}>Coming soon</Text>
    </View>
  );
}

// ─── Stack setup ────────────────────────────────────────────────────────────
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          color: Colors.text,
          fontWeight: '600' as const,
          fontSize: 17,
        },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
      initialRouteName="Main"
    >
      {/* Auth flow – no header, full screen */}
      <Stack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{ headerShown: false, animation: 'fade' }}
      />

      {/* Main app – tab navigator, no header */}
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false, animation: 'fade' }}
      />

      {/* ── Chat ────────────────────────────────────────────────────────── */}
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ headerShown: true, title: 'Chat' }} />
      <Stack.Screen name="DualPaneChat" component={DualPaneChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AnonymousChat" component={AnonymousChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AudioCall" component={AudioCallScreen} options={{ headerShown: false, animation: 'fade' }} />

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: true, title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
      <Stack.Screen name="ShareProfile" component={ShareProfileScreen} options={{ headerShown: true, title: 'Share Profile' }} />

      {/* ── Posts & Stories ─────────────────────────────────────────────── */}
      <Stack.Screen name="PostDetail" component={PlaceholderScreen} options={{ headerShown: true, title: 'Post' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: true, title: 'Create Post', presentation: 'modal' }} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="StoryCreator" component={StoryCreatorScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />

      {/* ── Articles ────────────────────────────────────────────────────── */}
      <Stack.Screen name="ArticleView" component={ArticleViewScreen} options={{ headerShown: true, title: 'Article' }} />
      <Stack.Screen name="WriteArticle" component={WriteArticleScreen} options={{ headerShown: true, title: 'Write Article' }} />

      {/* ── Marketplace / Store ─────────────────────────────────────────── */}
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: true, title: 'Product' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Cart' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, title: 'Checkout' }} />
      <Stack.Screen name="MyStore" component={MyStoreScreen} options={{ headerShown: true, title: 'My Store' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: true, title: 'Add Product' }} />
      <Stack.Screen name="Storefront" component={StorefrontScreen} options={{ headerShown: true, title: 'Storefront' }} />
      <Stack.Screen name="StoreDashboard" component={StoreDashboardScreen} options={{ headerShown: true, title: 'Store Dashboard' }} />
      <Stack.Screen name="BusinessOrders" component={BusinessOrdersScreen} options={{ headerShown: true, title: 'Business Orders' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: true, title: 'Order Tracking' }} />

      {/* ── Business / CRM ──────────────────────────────────────────────── */}
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} options={{ headerShown: true, title: 'Business' }} />
      <Stack.Screen name="CrmLeads" component={CrmLeadsScreen} options={{ headerShown: true, title: 'Leads' }} />
      <Stack.Screen name="CrmDeals" component={CrmDealsScreen} options={{ headerShown: true, title: 'Deals' }} />
      <Stack.Screen name="CrmOrders" component={CrmOrdersScreen} options={{ headerShown: true, title: 'Orders' }} />
      <Stack.Screen name="CrmAnalytics" component={CrmAnalyticsScreen} options={{ headerShown: true, title: 'Analytics' }} />

      {/* ── Ads ─────────────────────────────────────────────────────────── */}
      <Stack.Screen name="AdsManager" component={AdsManagerScreen} options={{ headerShown: true, title: 'Ads Manager' }} />
      <Stack.Screen name="CreateAd" component={CreateAdScreen} options={{ headerShown: true, title: 'Create Ad' }} />

      {/* ── Premium & Affiliates ────────────────────────────────────────── */}
      <Stack.Screen name="PremiumDashboard" component={PremiumDashboardScreen} options={{ headerShown: true, title: 'Premium' }} />
      <Stack.Screen name="Affiliates" component={AffiliatesScreen} options={{ headerShown: true, title: 'Affiliates' }} />

      {/* ── Employer / Salary ───────────────────────────────────────────── */}
      <Stack.Screen name="Salary" component={SalaryScreen} options={{ headerShown: true, title: 'Salary' }} />
      <Stack.Screen name="Performance" component={PerformanceScreen} options={{ headerShown: true, title: 'Performance' }} />

      {/* ── Settings ────────────────────────────────────────────────────── */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerShown: true, title: 'Privacy' }} />

      {/* ── Misc ────────────────────────────────────────────────────────── */}
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ headerShown: true, title: 'Bookmarks' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  placeholderSubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
});
