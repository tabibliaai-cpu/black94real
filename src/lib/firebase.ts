import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// ── Firebase Config ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyBAVWmNA9fo0hg4xRIi_O6ry3kAuuQylck',
  authDomain: 'black94.firebaseapp.com',
  projectId: 'black94',
  storageBucket: 'black94.firebasestorage.app',
  messagingSenderId: '210565807767',
  appId: '1:210565807767:web:7ba097fc1980fce42373d2',
  measurementId: 'G-9SRSQ1S4ME',
};

// ── Init ────────────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ── Google Provider ─────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
export { googleProvider };

// ── Persist sessions across tabs/reloads ────────────────────────────────────
export const authReady = setPersistence(auth, browserLocalPersistence)
  .then(() => undefined)
  .catch((err) => console.error('[Firebase] persistence failed:', err));

// ── Detect if running inside Android WebView ──────────────────────────────────
function isWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (ua.includes('wv') || ua.includes('Black94App') ||
    (ua.includes('Android') && !ua.includes('Chrome')) ||
    (typeof (window as any).Black94Native !== 'undefined'));
}

// ── Sign In — uses redirect in WebView, popup in browser ─────────────────────
export async function signIn(): Promise<import('firebase/auth').UserCredential> {
  await authReady;

  // Check for pending redirect result first (from previous redirect sign-in)
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) return result;
  } catch {
    // No pending redirect, continue with sign-in
  }

  // Use redirect in WebView (popups don't work reliably in WebViews)
  // even with multi-window support enabled
  if (isWebView()) {
    return signInWithRedirect(auth, googleProvider);
  }

  return signInWithPopup(auth, googleProvider);
}

// ── Sign Out ────────────────────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('black94_token');
  localStorage.removeItem('black94_user');
}

// ── Auth state listener (single source of truth) ────────────────────────────
export { onAuthStateChanged };

// ── Check for redirect result on page load (handles WebView redirect sign-in) ─
export async function checkRedirectResult(): Promise<import('firebase/auth').UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch {
    return null;
  }
}

// ── FCM (Push Notifications) ─────────────────────────────────────────────
let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Push not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }

    const vapidKey = 'BH8aoQiO005uIwVOrWY1p4wGZd4pRhFsz447PHh8c7NuoeP79tFcKudJrOLczXEwKhjafO8RkzC2h_PyypYcgtU';
    const token = await getToken(messagingInstance, { vapidKey });
    return token;
  } catch (err) {
    console.warn('[FCM] Failed to get token:', err);
    return null;
  }
}

export async function setupFCMListener(): Promise<void> {
  try {
    const supported = await isSupported();
    if (!supported) return;

    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }

    onMessage(messagingInstance, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: body || '',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'black94-notification',
            data: payload.data,
          });
        });
      }
    });
  } catch (err) {
    console.warn('[FCM] Listener setup failed:', err);
  }
}

export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    await setDoc(tokenRef, {
      tokens: arrayUnion(token),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[FCM] Failed to save token:', err);
  }
}

export default app;
