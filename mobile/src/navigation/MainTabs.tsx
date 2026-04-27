import React from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from 'react-native-vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme';
import { useAppStore } from '../stores/app';
import type { MainTabParamList } from './types';

// ─── Screen imports ─────────────────────────────────────────────────────────
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatListScreen from '../screens/ChatListScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// ─── Tab navigator ──────────────────────────────────────────────────────────
export type MainTabsNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const unreadChats = useAppStore((s) => s.unreadChats);
  const unreadNotifications = useAppStore((s) => s.unreadNotificationCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconSize = size;
          switch (route.name) {
            case 'Feed':
              return <Ionicons name="home" color={color} size={iconSize} />;
            case 'Search':
              return <Ionicons name="search" color={color} size={iconSize} />;
            case 'Chat':
              return (
                <Ionicons name="chatbubble" color={color} size={iconSize} />
              );
            case 'Notifications':
              return <Ionicons name="bell" color={color} size={iconSize} />;
            case 'Profile':
              return <Ionicons name="person" color={color} size={iconSize} />;
            default:
              return <Ionicons name="ellipse" color={color} size={iconSize} />;
          }
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />

      <Tab.Screen name="Search" component={SearchScreen} />

      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarBadge: unreadChats > 0 ? unreadChats : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadNotifications > 0 ? unreadNotifications : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 56,
    paddingBottom: 4,
    paddingTop: 4,
  },
  badge: {
    backgroundColor: Colors.error,
    color: '#ffffff',
    fontSize: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
});
