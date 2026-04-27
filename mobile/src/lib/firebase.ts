/**
 * firebase.ts — React Native Firebase Setup
 *
 * Uses @react-native-firebase/* modules (NOT the web firebase SDK).
 * The native modules handle initialization automatically via google-services.json / GoogleService-Info.plist.
 * This file re-exports the initialized instances for use throughout the app.
 */

import auth, { firebase } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

// ── Firebase Config (same as web app, for reference / analytics) ──────────────

export const firebaseConfig = {
  apiKey: 'AIzaSyBAVWmNA9fo0hg4xRIi_O6ry3kAuuQylck',
  authDomain: 'black94.firebaseapp.com',
  projectId: 'black94',
  storageBucket: 'black94.firebasestorage.app',
  messagingSenderId: '210565807767',
  appId: '1:210565807767:web:7ba097fc1980fce42373d2',
  measurementId: 'G-9SRSQ1S4ME',
};

export const WEB_CLIENT_ID =
  '210565807767-jtedotfd6hqn8cn31meuk2cfp2dkm88o.apps.googleusercontent.com';

export const VAPID_KEY =
  'BH8aoQiO005uIwVOrWY1p4wGZd4pRhFsz447PHh8c7NuoeP79tFcKudJrOLczXEwKhjafO8RkzC2h_PyypYcgtU';

// ── Export initialized instances ─────────────────────────────────────────────

// Auth — native Firebase Auth module
export { auth };

// Firestore — initialized instance (settings applied below)
export const db = firestore();

// Storage — Firebase Storage module
export { storage };

// Messaging — FCM module for push notifications
export { messaging };

// ── Firestore Settings ───────────────────────────────────────────────────────

// Enable offline persistence by default (default in RN Firebase, but explicit)
db.settings({ persistence: true });

// ── Auth Helpers ─────────────────────────────────────────────────────────────

/** Sign out the current user */
export async function signOutUser(): Promise<void> {
  await auth().signOut();
}

/** Get the current authenticated user (or null) */
export function getCurrentUser() {
  return auth().currentUser;
}

/** Listen to auth state changes */
export function onAuthStateChanged(
  callback: (user: firebase.User | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

// ── FCM (Push Notifications) ────────────────────────────────────────────────

/** Request notification permission and get FCM token */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    const token = await messaging().getToken();
    return token;
  } catch (err) {
    console.warn('[FCM] Failed to get token:', err);
    return null;
  }
}

/** Save an FCM token to Firestore for the given user */
export async function saveFCMToken(
  userId: string,
  token: string,
): Promise<void> {
  try {
    await db()
      .collection('fcmTokens')
      .doc(userId)
      .set(
        {
          tokens: firestore.FieldValue.arrayUnion(token),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  } catch (err) {
    console.warn('[FCM] Failed to save token:', err);
  }
}

/** Register foreground message handler */
export function setupFCMListener(
  onMessage: (message: {
    messageId: string;
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }) => void,
): () => void {
  return messaging().onMessage(onMessage);
}

/** Register background/quit message handler (call from index.js) */
export function registerBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[FCM] Background message:', remoteMessage.messageId);
  });
}

// ── Sign Out with cleanup ───────────────────────────────────────────────────

export default firebase;
