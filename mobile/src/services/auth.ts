/**
 * services/auth.ts — Authentication service for the mobile app
 *
 * Handles Google Sign-In via @react-native-google-signin/google-signin
 * and Firebase Auth integration.
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-community/google-signin';
import { createUserFromGoogle } from '../lib/db';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '210565807767-abc123.apps.googleusercontent.com',
  offlineAccess: true,
});

export interface AuthResult {
  user: FirebaseAuthTypes.User;
  isNewUser: boolean;
}

/**
 * Sign in with Google. Creates a Firestore user doc if new.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  // 1. Get Google ID token
  await GoogleSignin.hasPlayServices();
  const { idToken } = await GoogleSignin.signIn();
  if (!idToken) {
    throw new Error('Google Sign-In failed: no ID token received');
  }

  // 2. Create Firebase credential
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // 3. Sign in to Firebase
  const userCredential = await auth().signInWithCredential(googleCredential);
  const firebaseUser = userCredential.user;

  if (!firebaseUser) {
    throw new Error('Firebase sign-in failed: no user returned');
  }

  // 4. Create Firestore user doc if new
  let isNewUser = false;
  try {
    await createUserFromGoogle({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    });
  } catch (err: any) {
    if (err?.message?.includes('already exists')) {
      // User already exists — that's fine
    } else {
      console.warn('[auth] createUserFromGoogle error:', err);
    }
  }

  return { user: firebaseUser, isNewUser };
}

/**
 * Sign out from both Google and Firebase.
 */
export async function signOut(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (err) {
    console.warn('[auth] GoogleSignin.signOut error (non-critical):', err);
  }
  await auth().signOut();
}
