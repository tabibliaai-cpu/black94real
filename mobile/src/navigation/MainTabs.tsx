import React from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';
import { useAppStore } from '../stores/app';
import type { MainTabParamList } from './types';

// ─── Screen imports ─────────────────────────────────────────────────────────
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatListScreen from '../screens/ChatListScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import StoriesScreen from '../screens/StoriesScreen';

// ─── Tab navigator ──────────────────────────────────────────────────────────
export type MainTabsNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

// Web app MobileNav tabs: Home, Search, Chat, Alerts, Stories
// Icons: House, Search, MessageCircle, Bell, Radio (from Lucide React)
export default function MainTabs() {
  const unreadChats = useAppStore((s) => s.unreadChats);
  const unreadNotifications = useAppStore((s) => s.unreadNotificationCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary, // WHITE when active
        tabBarInactiveTintColor: Colors.textMuted, // #71767b when inactive
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = 24;
          switch (route.name) {
            // Web: Home icon (House) - filled when active
            case 'Feed':
              return <TabIcon name={focused ? 'home' : 'home-outline'} color={color} size={iconSize} />;
            case 'Search':
              return <TabIcon name={focused ? 'search' : 'search-outline'} color={color} size={iconSize} />;
            case 'Chat':
              return (
                <View style={styles.iconWithBadge}>
                  <TabIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} size={iconSize} />
                  {unreadChats > 0 && (
                    <View style={styles.badgeDot} />
                  )}
                </View>
              );
            case 'Notifications':
              return (
                <View style={styles.iconWithBadge}>
                  <TabIcon name={focused ? 'notifications' : 'notifications-outline'} color={color} size={iconSize} />
                  {unreadNotifications > 0 && (
                    <View style={styles.badgeDot} />
                  )}
                </View>
              );
            case 'Stories':
              return <TabIcon name={focused ? 'radio' : 'radio-outline'} color={color} size={iconSize} />;
            default:
              return <TabIcon name="ellipse-outline" color={color} size={iconSize} />;
          }
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Stories" component={StoriesScreen} />
    </Tab.Navigator>
  );
}

// ─── Ionicon wrapper ────────────────────────────────────────────────────────
import Icon from 'react-native-vector-icons/Ionicons';

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Icon name={name} color={color} size={size} />;
}

// ─── Styles — matched to web MobileNav (50px height, no label, white active) ─
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000', // Web: mobile nav bg = black
    borderTopColor: 'transparent', // Web: no visible top border
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 60, // Account for safe area
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 4,
    elevation: 0, // No shadow on Android
    shadowOpacity: 0,
  },
  iconWithBadge: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Web: notification badge is a small white dot (not a blue circle)
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF', // Web: white dot
  },
});
