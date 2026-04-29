import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useAppStore } from '../stores/app';
import { createUserFromGoogle } from '../services/auth';

/**
 * AuthScreen — Login screen matching web app's clean design.
 *
 * Web: Black bg, "Welcome to Black94" heading, subtitle text,
 * Google sign-in button (white bg, dark text), terms link below.
 * No colored icon box, no blue accents.
 */

export default function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');

      GoogleSignin.configure({
        scopes: ['email', 'profile'],
        webClientId: '210565807767-jtedotfd6hqn8cn31meuk2cfp2dkm88o.apps.googleusercontent.com',
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('Failed to obtain Google ID token');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      await createUserFromGoogle(userCredential);

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
      if (error.code !== '12501') {
        // Use Alert from react-native
        const { Alert } = require('react-native');
        Alert.alert('Sign In Error', error.message || 'Something went wrong.');
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
        {/* ── Brand ────────────────────────────────────────────────────── */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>Black94</Text>
          <Text style={styles.tagline}>
            {mode === 'signin'
              ? "See what's happening in the world right now."
              : 'Join Black94 today.'}
          </Text>
        </View>

        {/* ── Spacer ────────────────────────────────────────────────────── */}
        <View style={styles.spacer} />

        {/* ── Sign In / Sign Up ────────────────────────────────────────── */}
        <View style={styles.authContainer}>
          {/* ── Google Button ─────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <View style={styles.googleButtonContent}>
                {/* Google "G" circle */}
                <View style={styles.googleGContainer}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Toggle mode ───────────────────────────────────────────── */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {mode === 'signin'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text
                style={styles.toggleLink}
                onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </View>

          {/* ── Terms text ─────────────────────────────────────────────── */}
          <Text style={styles.termsText}>
            By signing in, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>{' '}
            and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles — matched to web login page ──────────────────────────────────────
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
  // Brand — web: large "Black94" text, no icon box
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  brandName: {
    color: Colors.primary, // WHITE
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  spacer: {
    flex: 1,
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  // Google button — web style: white bg, rounded, dark text
  googleButton: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.primary, // WHITE
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  googleGContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4', // Google blue for the G icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  googleButtonText: {
    color: Colors.primaryForeground, // BLACK text
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  toggleContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleLink: {
    color: Colors.primary, // WHITE (or could be neon for contrast)
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.xxl,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
