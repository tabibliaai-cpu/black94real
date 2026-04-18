import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// ── Google Provider ─────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
export { googleProvider };

// ── Persist sessions across tabs/reloads ────────────────────────────────────
export const authReady = setPersistence(auth, browserLocalPersistence)
  .then(() => undefined)
  .catch((err) => console.error('[Firebase] persistence failed:', err));

// ── Sign In (popup only — no page reload, no redirect race conditions) ──────
export async function signIn(): Promise<import('firebase/auth').UserCredential> {
  await authReady;
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

export default app;
