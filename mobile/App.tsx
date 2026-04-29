import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import RootStack from './src/navigation/RootStack';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useAppStore } from './src/stores/app';
import { Colors } from './src/theme';

// ─── Custom dark theme for NavigationContainer ──────────────────────────────
const AppDarkTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: Colors.primary,        // WHITE (not blue)
    background: Colors.background,  // #000000
    card: Colors.background,        // #000000 (matching web)
    text: Colors.text,              // #e7e9ea
    border: Colors.border,          // #374151
    notification: Colors.error,
  },
};

// ─── App Component ──────────────────────────────────────────────────────────
function App() {
  const [initializing, setInitializing] = useState(true);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const isAuthLoading = useAppStore((s) => s.isAuthLoading);

  // Handle auth state changes
  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    if (user) {
      setUser({
        id: user.uid,
        email: user.email ?? '',
        username: '',
        displayName: user.displayName ?? null,
        bio: '',
        profileImage: user.photoURL ?? '',
        coverImage: '',
        role: 'user',
        badge: '',
        subscription: 'free',
        isVerified: false,
        accountType: 'personal',
        accountLocked: false,
        nameVisibility: 'public',
        dmPermission: 'everyone',
        searchVisibility: 'public',
        paidChatEnabled: false,
        paidChatPrice: 0,
        createdAt: new Date().toISOString(),
      } as any);
    } else {
      setUser(null);
    }

    if (initializing) {
      setInitializing(false);
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    // Subscribe to auth state changes
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

    // Clean up subscription on unmount
    return subscriber;
  }, [initializing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <NavigationContainer theme={AppDarkTheme}>
          {initializing || isAuthLoading ? (
            <SplashScreen />
          ) : (
            <AppNavigator />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Auth-aware navigator ───────────────────────────────────────────────────
function AppNavigator() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // When authenticated, show the full RootStack (which includes Auth as initial route,
  // but the App will reset to Main). When not authenticated, show AuthNavigator only.
  // The RootStack handles both; we conditionally render to show Auth-only when unauthenticated.
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <RootStack />;
}

// ─── Splash / Loading Screen ────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashLogo}>
        <View style={styles.splashIcon}>
          <Text style={styles.splashLogoText}>B94</Text>
        </View>
      </View>
      <ActivityIndicator
        color={Colors.primary}
        size="small"
        style={styles.splashLoader}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    alignItems: 'center',
  },
  splashIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary, // WHITE
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  splashLogoText: {
    color: '#000000', // Black text on white
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  splashLoader: {
    marginTop: 24,
  },
});

export default App;
