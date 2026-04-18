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
  /** Server-side timestamp of the latest story in the group — used for ordering. */
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

/** 24 hours from now, as a Firestore Timestamp. */
function twentyFourHoursFromNow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
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
  const now = new Date();
  const ref = await addDoc(collection(db, 'stories'), {
    userId: params.userId,
    username: params.username,
    displayName: params.displayName,
    profileImage: params.profileImage,
    verified: params.verified,
    mediaUrl: params.mediaUrl,
    caption: params.caption,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(twentyFourHoursFromNow()),
  });

  return {
    id: ref.id,
    ...params,
    createdAt: now.toISOString(),
    expiresAt: twentyFourHoursFromNow().toISOString(),
  };
}

/**
 * Fetch all **active** (non-expired) stories from Firestore,
 * grouped by user, ordered by most-recent-first within each group.
 */
export async function fetchStoryGroups(): Promise<StoryGroup[]> {
  const storiesRef = collection(db, 'stories');
  const now = Timestamp.now();

  // Only fetch stories whose expiresAt is in the future
  const q = query(
    storiesRef,
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'asc'),   // ensures the index covers the where clause
    orderBy('createdAt', 'desc'),
  );

  const snap = await getDocs(q);

  // Group by userId
  const groupMap = new Map<string, StoryGroup>();

  for (const docSnap of snap.docs) {
    const d = docSnap.data()!;
    const userId: string = d.userId ?? '';
    const createdAt = tsToISO(d.createdAt);

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

  return groups;
}

/**
 * Delete a story by id.
 */
export async function deleteStory(storyId: string): Promise<void> {
  await deleteDoc(doc(db, 'stories', storyId));
}

/**
 * Fetch stories for a specific user (e.g. the logged-in user).
 */
export async function fetchUserStories(userId: string): Promise<Story[]> {
  const storiesRef = collection(db, 'stories');
  const now = Timestamp.now();
  const q = query(
    storiesRef,
    where('userId', '==', userId),
    where('expiresAt', '>', now),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
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
  });
}
