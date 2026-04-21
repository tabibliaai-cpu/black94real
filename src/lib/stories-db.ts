/* ── Stories Firestore CRUD ─────────────────────────────────────────────────── */
/* Upload strategy: Try Firebase Storage first (fast binary upload).
   If Storage is not set up or rules reject, fall back to compressed
   base64 in Firestore. Either way the story gets created.              */

import {
  db,
  storage,
} from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
  mediaUrl: string;          // Storage download URL OR compressed data-URL
  caption: string;
  createdAt: string;
  expiresAt: string;         // 24 h from creation
}

/** Stories grouped by author (for the ring-bar UI). */
export interface StoryGroup {
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
  stories: Pick<Story, 'id' | 'mediaUrl' | 'caption' | 'createdAt'>[];
  latestCreatedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function tsToISO(value: unknown): string {
  if (value && typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds: number };
    return new Date(ts.seconds * 1000 + ts.nanoseconds / 1_000_000).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** 24 hours from now, as a Date. */
function twentyFourHoursFromNow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

// ── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Create a new story document.
 * Strategy:
 *   1. Try Firebase Storage upload (fast, binary). On success, store download URL.
 *   2. If Storage fails (not set up, rules block, etc.), fall back to a heavily
 *      compressed base64 data-URL stored directly in Firestore.
 * Either way, the story is created and visible immediately.
 */
export async function createStory(params: {
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
  mediaBlob: Blob;
  mediaBase64: string;       // fallback — compressed JPEG data-URL
  caption: string;
}): Promise<Story> {
  console.log('[stories-db] createStory → userId:', params.userId);

  const now = new Date();
  const expiresAt = twentyFourHoursFromNow();
  let mediaUrl = params.mediaBase64; // default: base64 fallback
  let storagePath = '';

  // ── Try Firebase Storage first ──
  try {
    const storyId = `${params.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    storagePath = `stories/${params.userId}/${storyId}.jpg`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, params.mediaBlob, {
      contentType: 'image/jpeg',
    });
    mediaUrl = await getDownloadURL(storageRef);
    console.log('[stories-db] Storage upload ✅ →', storagePath);
  } catch (storageErr) {
    console.warn('[stories-db] Storage upload failed, using base64 fallback:', storageErr);
    // Keep mediaUrl as the compressed base64 — still works, just bigger doc
  }

  // ── Write to Firestore ──
  const firestoreRef = await addDoc(collection(db, 'stories'), {
    userId: params.userId,
    username: params.username,
    displayName: params.displayName,
    profileImage: params.profileImage,
    verified: params.verified,
    mediaUrl,
    caption: params.caption,
    ...(storagePath ? { storagePath } : {}),
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  console.log('[stories-db] Firestore write ✅ → storyId:', firestoreRef.id);

  return {
    id: firestoreRef.id,
    userId: params.userId,
    username: params.username,
    displayName: params.displayName,
    profileImage: params.profileImage,
    verified: params.verified,
    mediaUrl,
    caption: params.caption,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Fetch all active (non-expired) stories from Firestore,
 * grouped by user, ordered by most-recent-first within each group.
 */
export async function fetchStoryGroups(): Promise<StoryGroup[]> {
  console.log('[stories-db] fetchStoryGroups → fetching all stories…');

  const storiesRef = collection(db, 'stories');
  const q = query(
    storiesRef,
    orderBy('createdAt', 'desc'),
    firestoreLimit(200),
  );

  const snap = await getDocs(q);
  console.log('[stories-db] fetchStoryGroups → raw docs:', snap.docs.length);

  const now = Date.now();
  const groupMap = new Map<string, StoryGroup>();

  for (const docSnap of snap.docs) {
    const d = docSnap.data()!;
    const createdAt = tsToISO(d.createdAt);
    const expiresAt = tsToISO(d.expiresAt);

    // Client-side expiry filter
    if (new Date(expiresAt).getTime() < now) continue;

    const userId: string = d.userId ?? '';

    if (!groupMap.has(userId)) {
      groupMap.set(userId, {
        userId,
        username: d.username ?? '',
        displayName: d.displayName ?? '',
        profileImage: d.profileImage ?? '',
        verified: d.verified ?? false,
        stories: [],
        latestCreatedAt: createdAt,
      });
    }

    const group = groupMap.get(userId)!;
    group.stories.push({
      id: docSnap.id,
      mediaUrl: d.mediaUrl ?? '',
      caption: d.caption ?? '',
      createdAt,
    });
  }

  // Sort groups: most recently posted first
  const groups = Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
  );

  console.log('[stories-db] fetchStoryGroups ✅ → groups:', groups.length, 'total stories:', groups.reduce((n, g) => n + g.stories.length, 0));
  return groups;
}

/**
 * Fetch stories for a specific user (e.g. the logged-in user).
 */
export async function fetchUserStories(userId: string): Promise<Story[]> {
  console.log('[stories-db] fetchUserStories → userId:', userId);

  const storiesRef = collection(db, 'stories');

  let docs: Awaited<ReturnType<typeof getDocs>>;

  try {
    const now = Timestamp.now();
    const q = query(
      storiesRef,
      where('userId', '==', userId),
      where('expiresAt', '>', now),
      orderBy('createdAt', 'desc'),
    );
    docs = await getDocs(q);
  } catch (indexErr) {
    console.warn('[stories-db] fetchUserStories → compound query failed, falling back:', indexErr);
    const q = query(
      storiesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50),
    );
    docs = await getDocs(q);
  }

  const now = Date.now();
  const stories = docs.docs
    .map((docSnap) => {
      const d = docSnap.data()!;
      return {
        id: docSnap.id,
        userId: d.userId ?? '',
        username: d.username ?? '',
        displayName: d.displayName ?? '',
        profileImage: d.profileImage ?? '',
        verified: d.verified ?? false,
        mediaUrl: d.mediaUrl ?? '',
        caption: d.caption ?? '',
        createdAt: tsToISO(d.createdAt),
        expiresAt: tsToISO(d.expiresAt),
      };
    })
    .filter((s) => new Date(s.expiresAt).getTime() > now);

  console.log('[stories-db] fetchUserStories ✅ →', stories.length, 'stories for user', userId);
  return stories;
}

/**
 * Delete a story by id (only own stories).
 */
export async function deleteStory(storyId: string): Promise<void> {
  console.log('[stories-db] deleteStory → storyId:', storyId);
  await deleteDoc(doc(db, 'stories', storyId));
  console.log('[stories-db] deleteStory ✅');
}
