/* ── Stories Firestore CRUD ─────────────────────────────────────────────────── */
/* Separate from db.ts (locked) — stories have their own collection & TTL logic. */

import {
  db,
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

// ── Types ───────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
  mediaUrl: string;          // compressed JPEG base64 data-URL
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

/** Check if a story ISO timestamp is still within 24h window. */
function isNotExpired(createdAtISO: string, expiresAtISO: string): boolean {
  return new Date(expiresAtISO).getTime() > Date.now();
}

// ── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Create a new story document.
 * Returns the created Story object (with server-generated id).
 */
export async function createStory(params: {
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
  mediaUrl: string;
  caption: string;
}): Promise<Story> {
  console.log('[stories-db] createStory → userId:', params.userId);

  const now = new Date();
  const expiresAt = twentyFourHoursFromNow();

  const ref = await addDoc(collection(db, 'stories'), {
    userId: params.userId,
    username: params.username,
    displayName: params.displayName,
    profileImage: params.profileImage,
    verified: params.verified,
    mediaUrl: params.mediaUrl,
    caption: params.caption,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  console.log('[stories-db] createStory ✅ → storyId:', ref.id);

  return {
    id: ref.id,
    ...params,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Fetch all active (non-expired) stories from Firestore,
 * grouped by user, ordered by most-recent-first within each group.
 *
 * Uses a simple `orderBy('createdAt', 'desc')` query (single-field index,
 * auto-created by Firestore) and filters expired stories client-side.
 * This avoids composite-index dependency and works immediately.
 */
export async function fetchStoryGroups(): Promise<StoryGroup[]> {
  console.log('[stories-db] fetchStoryGroups → fetching all stories…');

  const storiesRef = collection(db, 'stories');
  const q = query(
    storiesRef,
    orderBy('createdAt', 'desc'),
    firestoreLimit(200),     // safety cap — stories are ephemeral (24h) so count is low
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
 * Also uses simple query + client-side filtering.
 */
export async function fetchUserStories(userId: string): Promise<Story[]> {
  console.log('[stories-db] fetchUserStories → userId:', userId);

  const storiesRef = collection(db, 'stories');

  // Try the compound query first (needs composite index)
  // Fall back to simple query if it fails
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
    // Composite index likely missing — fall back to simple query
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
    // Client-side expiry filter as safety net
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
