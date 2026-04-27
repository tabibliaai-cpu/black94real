import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useAppStore } from '../stores/app';
import { createUserFromGoogle } from '../services/auth';

/**
 * AuthScreen – Login screen with Google Sign-In.
 *
 * Requires `@react-native-google-signin/google-signin` to be installed.
 * Run:  npm install @react-native-google-signin/google-signin
 * Then rebuild native (cd ios && pod install / cd android && ./gradlew clean)
 */

export default function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      // Dynamically import to avoid crash if package is not installed yet
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      // Configure Google Sign-In
      GoogleSignin.configure({
        scopes: ['email', 'profile'],
        webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // TODO: replace with your Firebase web client ID
        offlineAccess: true,
      });

      // Check if play services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Trigger the Google Sign-In flow
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token for Firebase
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('Failed to obtain Google ID token');
      }

      // Create Firebase credential and sign in
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      // Create / update user document in Firestore
      await createUserFromGoogle(userCredential);

      // Update app state with full User object
      const firebaseUser = userCredential.user;
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        username: firebaseUser.email?.split('@')[0] ?? '',
        displayName: firebaseUser.displayName ?? null,
        bio: '',
        profileImage: firebaseUser.photoURL ?? '',
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
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Don't show alert if user simply cancelled
      if (error.code !== '12501') {
        Alert.alert(
          'Sign In Error',
          error.message || 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
      setAuthLoading(false);
    }
  }, [setUser, setAuthLoading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.innerContainer}>
        {/* ── Logo / Brand ──────────────────────────────────────────────── */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>B94</Text>
          </View>
          <Text style={styles.logoText}>Black94</Text>
          <Text style={styles.tagline}>Connect. Create. Commerce.</Text>
        </View>

        {/* ── Spacer ────────────────────────────────────────────────────── */}
        <View style={styles.spacer} />

        {/* ── Sign In Button ────────────────────────────────────────────── */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.googleButtonContent}>
                {/* Google "G" SVG as text fallback */}
                <View style={styles.googleGContainer}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Terms text ──────────────────────────────────────────────── */}
          <Text style={styles.termsText}>
            By signing in, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* ── Version ───────────────────────────────────────────────────── */}
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIconText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoText: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Button area
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  googleGContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background,
  },
  googleButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.lg,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontSize: 12,
  },

  // Version
  versionText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: Spacing.xxxl,
    opacity: 0.5,
  },
});
