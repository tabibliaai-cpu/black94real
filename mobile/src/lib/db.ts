/**
 * db.ts — Firestore Database Functions (React Native Firebase)
 *
 * Port of the web app's db.ts, adapted for @react-native-firebase/firestore.
 * Uses `firestore().collection().doc()` syntax instead of modular imports.
 *
 * All functions follow the same API contract as the web version.
 */

import auth from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { getOrCreateKeyPair } from './crypto';

// ── Re-export firestore instance for screens that need direct access ──────
export { firestore };

// ── Types ────────────────────────────────────────────────────────────────────

export interface Black94User {
  uid: string;
  email: string;
  username: string;
  usernameLower: string;
  displayName: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  role: 'personal' | 'creator' | 'professional' | 'business';
  badge: '' | 'blue' | 'gold';
  subscription: string;
  isVerified: boolean;
  nameVisibility: 'public' | 'private';
  dmPermission: 'all' | 'followers' | 'paid';
  searchVisibility: 'public' | 'private';
  paidChatEnabled: boolean;
  paidChatPrice: number;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorBadge: string;
  authorIsVerified: boolean;
  caption: string;
  mediaUrls: string;
  factCheck: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  isPaidChat: boolean;
  chatPrice: number;
  isPaidBy: string | null;
  isDeleted: boolean;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  otherUser?: Black94User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'video';
  mediaUrl: string | null;
  status: 'sent' | 'delivered' | 'seen';
  createdAt: string;
}

export interface Black94Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'repost' | 'engagement';
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorProfileImage: string;
  postId?: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  format: string;
  content: string;
  mediaUrl: string;
  language: string;
  pollOptions?: Array<{ id: string; text: string; votes: number; percentage: number }>;
  voiceUrl?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  festivalTemplate?: { id: string; name: string; gradient: string; emoji: string; textColor: string };
  cricketData?: { team1: string; team2: string; team1Score: string; team2Score: string; overs: string; venue: string; status: string };
  audience: string;
  expiry: string;
  viewCount: number;
  createdAt: string;
}

// ── Helper: Firestore Timestamp → ISO string ────────────────────────────────

function tsToISO(value: unknown): string {
  if (value && typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds: number };
    return new Date(ts.seconds * 1000 + ts.nanoseconds / 1_000_000).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

// ── Doc Converters ───────────────────────────────────────────────────────────

type DocSnap = FirebaseFirestoreTypes.DocumentSnapshot;

function docToBlack94User(docSnap: DocSnap): Black94User {
  const d = docSnap.data()!;
  return {
    uid: d.uid ?? docSnap.id,
    email: d.email ?? '',
    username: d.username ?? '',
    usernameLower: d.usernameLower ?? '',
    displayName: d.displayName ?? '',
    bio: d.bio ?? '',
    profileImage: d.profileImage ?? '',
    coverImage: d.coverImage ?? '',
    role: d.role ?? 'personal',
    badge: d.badge ?? 'blue',
    subscription: d.subscription ?? 'free',
    isVerified: d.isVerified ?? true,
    nameVisibility: d.nameVisibility ?? 'public',
    dmPermission: d.dmPermission ?? 'all',
    searchVisibility: d.searchVisibility ?? 'public',
    paidChatEnabled: d.paidChatEnabled ?? false,
    paidChatPrice: d.paidChatPrice ?? 0,
    publicKey: d.publicKey ?? '',
    createdAt: tsToISO(d.createdAt),
    updatedAt: tsToISO(d.updatedAt),
  };
}

export function docToPost(docSnap: DocSnap): Post {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    authorId: d.authorId ?? '',
    authorUsername: d.authorUsername ?? '',
    authorDisplayName: d.authorDisplayName ?? '',
    authorProfileImage: d.authorProfileImage ?? '',
    authorBadge: d.authorBadge ?? '',
    authorIsVerified: d.authorIsVerified ?? false,
    caption: d.caption ?? '',
    mediaUrls: d.mediaUrls ?? '',
    factCheck: d.factCheck ?? '',
    likeCount: d.likeCount ?? 0,
    commentCount: d.commentCount ?? 0,
    isLiked: d.isLiked ?? false,
    createdAt: tsToISO(d.createdAt),
    updatedAt: tsToISO(d.updatedAt),
  };
}

function docToComment(docSnap: DocSnap): Comment {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    postId: d.postId ?? '',
    authorId: d.authorId ?? '',
    authorUsername: d.authorUsername ?? '',
    authorDisplayName: d.authorDisplayName ?? '',
    content: d.content ?? '',
    createdAt: tsToISO(d.createdAt),
  };
}

function docToChat(docSnap: DocSnap): Chat {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    user1Id: d.user1Id ?? '',
    user2Id: d.user2Id ?? '',
    isPaidChat: d.isPaidChat ?? false,
    chatPrice: d.chatPrice ?? 0,
    isPaidBy: d.isPaidBy ?? null,
    isDeleted: d.isDeleted ?? false,
    unreadCount: d.unreadCount ?? 0,
    createdAt: tsToISO(d.createdAt),
    updatedAt: tsToISO(d.updatedAt),
  };
}

function docToMessage(docSnap: DocSnap): Message {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    chatId: d.chatId ?? '',
    senderId: d.senderId ?? '',
    receiverId: d.receiverId ?? '',
    content: d.content ?? '',
    messageType: d.messageType ?? 'text',
    mediaUrl: d.mediaUrl ?? null,
    status: d.status ?? 'sent',
    createdAt: tsToISO(d.createdAt),
  };
}

function docToNotification(docSnap: DocSnap): Black94Notification {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    userId: d.userId ?? '',
    type: d.type ?? 'like',
    actorId: d.actorId ?? '',
    actorName: d.actorName ?? '',
    actorUsername: d.actorUsername ?? '',
    actorProfileImage: d.actorProfileImage ?? '',
    postId: d.postId,
    message: d.message,
    read: d.read ?? false,
    createdAt: tsToISO(d.createdAt),
  };
}

function docToStory(docSnap: DocSnap): Story {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    authorId: d.authorId ?? '',
    authorUsername: d.authorUsername ?? '',
    authorDisplayName: d.authorDisplayName ?? '',
    authorProfileImage: d.authorProfileImage ?? '',
    authorIsVerified: d.authorIsVerified ?? false,
    format: d.format ?? 'text',
    content: d.content ?? '',
    mediaUrl: d.mediaUrl ?? '',
    language: d.language ?? 'en',
    pollOptions: d.pollOptions,
    voiceUrl: d.voiceUrl,
    voiceDuration: d.voiceDuration,
    voiceWaveform: d.voiceWaveform,
    festivalTemplate: d.festivalTemplate,
    cricketData: d.cricketData,
    audience: d.audience ?? 'everyone',
    expiry: d.expiry ?? '24h',
    viewCount: d.viewCount ?? 0,
    createdAt: tsToISO(d.createdAt),
  };
}

// ── User Functions ──────────────────────────────────────────────────────────

/**
 * Create a user document from a Firebase Auth user (e.g., after Google sign-in).
 * If the user already exists, returns the existing document.
 * Uses a transaction to atomically create the user doc and username reservation.
 */
export async function createUserFromGoogle(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<Black94User> {
  const userRef = firestore().collection('users').doc(user.uid);
  const existingSnap = await userRef.get();

  if (existingSnap.exists) {
    return docToBlack94User(existingSnap);
  }

  // Generate username from email
  const email = user.email ?? '';
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';

  const usernameLower = baseUsername.toLowerCase();
  let finalUsername = baseUsername;
  let finalUsernameLower = usernameLower;

  const usernameRef = firestore().collection('usernames').doc(usernameLower);
  const usernameSnap = await usernameRef.get();

  if (usernameSnap.exists) {
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    finalUsername = baseUsername + digits;
    finalUsernameLower = finalUsername.toLowerCase();
  }

  const now = new Date().toISOString();
  const userData: Black94User = {
    uid: user.uid,
    email: user.email ?? '',
    username: finalUsername,
    usernameLower: finalUsernameLower,
    displayName: user.displayName ?? finalUsername,
    bio: '',
    profileImage: user.photoURL ?? '',
    coverImage: '',
    role: 'personal',
    badge: 'blue',
    subscription: 'free',
    isVerified: true,
    nameVisibility: 'public',
    dmPermission: 'all',
    searchVisibility: 'public',
    paidChatEnabled: false,
    paidChatPrice: 0,
    publicKey: '',
    createdAt: now,
    updatedAt: now,
  };

  // Firestore transaction: ALL reads before ALL writes
  await firestore().runTransaction(async (transaction) => {
    const usernameCheckRef = firestore().collection('usernames').doc(finalUsernameLower);
    const usernameCheckSnap = await transaction.get(usernameCheckRef);
    if (usernameCheckSnap.exists) {
      throw new Error(`Username "${finalUsername}" is already taken`);
    }

    const userCheckSnap = await transaction.get(userRef);
    if (userCheckSnap.exists) {
      throw new Error(`User "${user.uid}" already exists`);
    }

    transaction.set(usernameCheckRef, { uid: user.uid });
    transaction.set(userRef, {
      ...userData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  return userData;
}

// ── E2E Key Pair ─────────────────────────────────────────────────────────────

const e2eInitCache = new Map<string, Promise<string>>();

/**
 * Ensure the current user has an E2E encryption keypair.
 * Generates a new X25519 keypair if none exists (stored in keychain).
 * Publishes the public key to the user's Firestore profile.
 * Idempotent — safe to call multiple times.
 */
export async function ensureE2EKeyPair(userId: string): Promise<string> {
  const cached = e2eInitCache.get(userId);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const { publicKeyBase64 } = await getOrCreateKeyPair(userId);

      const userRef = firestore().collection('users').doc(userId);
      const snap = await userRef.get();
      if (snap.exists && snap.data()?.publicKey === publicKeyBase64) {
        return publicKeyBase64;
      }

      await userRef.update({ publicKey: publicKeyBase64 });
      return publicKeyBase64;
    } finally {
      e2eInitCache.delete(userId);
    }
  })();

  e2eInitCache.set(userId, promise);
  return promise;
}

export async function getUser(uid: string): Promise<Black94User | null> {
  const snap = await firestore().collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return docToBlack94User(snap);
}

export async function updateUser(uid: string, data: Partial<Black94User>): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  await firestore().collection('users').doc(uid).update(updatePayload);
}

export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
  const usernameLower = username.toLowerCase();

  const usernameSnap = await firestore().collection('usernames').doc(usernameLower).get();
  if (usernameSnap.exists) {
    if (excludeUserId && usernameSnap.data()?.uid === excludeUserId) {
      // Don't return false — continue checking
    } else {
      return false;
    }
  }

  const usersSnap = await firestore()
    .collection('users')
    .where('usernameLower', '==', usernameLower)
    .get();

  if (!usersSnap.empty) {
    if (excludeUserId) {
      const otherUsers = usersSnap.docs.filter((d) => d.id !== excludeUserId);
      if (otherUsers.length > 0) return false;
    } else {
      return false;
    }
  }

  return true;
}

export async function updateUsername(uid: string, newUsername: string): Promise<void> {
  const newUsernameLower = newUsername.toLowerCase();

  await firestore().runTransaction(async (transaction) => {
    const userRef = firestore().collection('users').doc(uid);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new Error('User not found');
    }
    const oldUsernameLower = userSnap.data()?.usernameLower as string;
    if (oldUsernameLower === newUsernameLower) return;

    const newUsernameRef = firestore().collection('usernames').doc(newUsernameLower);
    const newUsernameSnap = await transaction.get(newUsernameRef);
    if (newUsernameSnap.exists) {
      throw new Error('Username is already taken');
    }

    if (oldUsernameLower) {
      const oldUsernameRef = firestore().collection('usernames').doc(oldUsernameLower);
      transaction.delete(oldUsernameRef);
    }

    transaction.set(newUsernameRef, { uid });
    transaction.update(userRef, {
      username: newUsername,
      usernameLower: newUsernameLower,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Batch-update ALL posts by a user with their latest profile data.
 * Ensures feed consistency — posts always show the author's current avatar/badge/verification.
 */
export async function updateAuthorDataInPosts(
  uid: string,
  data: {
    authorProfileImage?: string;
    authorIsVerified?: boolean;
    authorBadge?: string;
    authorDisplayName?: string;
    authorUsername?: string;
  },
): Promise<void> {
  const snap = await firestore()
    .collection('posts')
    .where('authorId', '==', uid)
    .get();

  if (snap.empty) return;

  // RN Firebase batch write limit is 500
  let batch = firestore().batch();
  let count = 0;

  for (const docSnap of snap.docs) {
    batch.update(docSnap.ref, data);
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      batch = firestore().batch();
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }
}

// ── Post Functions ──────────────────────────────────────────────────────────

/**
 * Fetch paginated feed posts.
 * @param limitCount - Number of posts to fetch
 * @param lastDoc - Last document snapshot from previous fetch (for pagination)
 */
export async function fetchFeedPosts(
  limitCount: number,
  lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot,
): Promise<{ posts: Post[]; lastDoc: FirebaseFirestoreTypes.DocumentSnapshot | null }> {
  let query: FirebaseFirestoreTypes.Query = firestore()
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .limit(limitCount);

  if (lastDoc) {
    query = firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .startAfter(lastDoc)
      .limit(limitCount);
  }

  const snap = await query.get();
  const posts = snap.docs.map(docToPost);
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { posts, lastDoc: newLastDoc };
}

export async function createPost(
  authorId: string,
  caption: string,
  mediaUrls?: string,
): Promise<Post> {
  const author = await getUser(authorId);
  if (!author) throw new Error('Author not found');

  const postRef = await firestore().collection('posts').add({
    authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorProfileImage: author.profileImage,
    authorBadge: author.badge,
    authorIsVerified: author.isVerified,
    caption,
    mediaUrls: mediaUrls ?? '',
    factCheck: '',
    likeCount: 0,
    commentCount: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  const snap = await postRef.get();
  return docToPost(snap);
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const likeRef = firestore().collection('posts').doc(postId).collection('likes').doc(userId);
  const postRef = firestore().collection('posts').doc(postId);

  const likeSnap = await likeRef.get();

  if (likeSnap.exists) {
    // Unlike
    await firestore().runTransaction(async (transaction) => {
      transaction.get(likeRef);
      transaction.get(postRef);
      transaction.delete(likeRef);
      transaction.update(postRef, { likeCount: firestore.FieldValue.increment(-1) });
    });
    return false;
  } else {
    // Like
    await firestore().runTransaction(async (transaction) => {
      transaction.get(likeRef);
      transaction.get(postRef);
      transaction.set(likeRef, { userId, createdAt: firestore.FieldValue.serverTimestamp() });
      transaction.update(postRef, { likeCount: firestore.FieldValue.increment(1) });
    });
    return true;
  }
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
): Promise<Comment> {
  const author = await getUser(userId);
  if (!author) throw new Error('User not found');

  const commentRef = await firestore().collection('posts').doc(postId).collection('comments').add({
    postId,
    authorId: userId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    content,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  const postRef = firestore().collection('posts').doc(postId);
  await postRef.update({
    commentCount: firestore.FieldValue.increment(1),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  const snap = await commentRef.get();
  return docToComment(snap);
}

export async function fetchUserPosts(uid: string, limitCount: number = 50): Promise<Post[]> {
  const snap = await firestore()
    .collection('posts')
    .where('authorId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snap.docs.map(docToPost);
}

export async function deletePost(postId: string): Promise<void> {
  await firestore().collection('posts').doc(postId).delete();
}

// ── Follow Functions ────────────────────────────────────────────────────────

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const followRef = firestore().collection('follows').doc(`${followerId}_${followingId}`);
  const followSnap = await followRef.get();

  if (followSnap.exists) {
    await followRef.delete();
    return false;
  } else {
    await followRef.set({
      followerId,
      followingId,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    // Notify the followed user (fire-and-forget)
    try {
      const followerSnap = await firestore().collection('users').doc(followerId).get();
      const follower = followerSnap.exists ? followerSnap.data() : null;
      createNotification({
        userId: followingId,
        type: 'follow',
        actorId: followerId,
        actorName: follower?.displayName || '',
        actorUsername: follower?.username || '',
        actorProfileImage: follower?.profileImage || '',
        message: 'started following you',
      });
    } catch (e) {
      console.warn('[db] toggleFollow: notification failed (non-critical):', e);
    }
    return true;
  }
}

/** Count how many users follow the given userId */
export async function getFollowerCount(userId: string): Promise<number> {
  try {
    const snap = await firestore()
      .collection('follows')
      .where('followingId', '==', userId)
      .get();
    return snap.size;
  } catch {
    return 0;
  }
}

/** Count how many users the given userId follows */
export async function getFollowingCount(userId: string): Promise<number> {
  try {
    const snap = await firestore()
      .collection('follows')
      .where('followerId', '==', userId)
      .get();
    return snap.size;
  } catch {
    return 0;
  }
}

/** Check if followerId follows followingId */
export async function checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const snap = await firestore().collection('follows').doc(`${followerId}_${followingId}`).get();
    return snap.exists;
  } catch {
    return false;
  }
}

// ── Chat Functions ──────────────────────────────────────────────────────────

export async function fetchChats(userId: string): Promise<Chat[]> {
  const q1 = firestore()
    .collection('chats')
    .where('user1Id', '==', userId)
    .orderBy('updatedAt', 'desc');
  const q2 = firestore()
    .collection('chats')
    .where('user2Id', '==', userId)
    .orderBy('updatedAt', 'desc');

  const [snap1, snap2] = await Promise.all([q1.get(), q2.get()]);

  const chatMap = new Map<string, Chat>();

  for (const snap of [snap1, snap2]) {
    for (const docSnap of snap.docs) {
      if (!chatMap.has(docSnap.id)) {
        chatMap.set(docSnap.id, docToChat(docSnap));
      }
    }
  }

  const chats = Array.from(chatMap.values());
  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      const otherUser = await getUser(otherUserId);
      return { ...chat, otherUser: otherUser ?? undefined };
    }),
  );

  return enrichedChats;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  receiverId: string,
  content: string,
  encrypted: boolean = false,
): Promise<Message> {
  const messageRef = await firestore().collection('chats').doc(chatId).collection('messages').add({
    chatId,
    senderId,
    receiverId,
    content,
    messageType: 'text',
    mediaUrl: null,
    status: 'sent',
    encrypted,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  await firestore().collection('chats').doc(chatId).update({
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  const snap = await messageRef.get();
  return docToMessage(snap);
}

export async function fetchMessages(chatId: string, limitCount: number): Promise<Message[]> {
  const snap = await firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  // Return in chronological order (oldest first)
  return snap.docs.map(docToMessage).reverse();
}

// ── Notification Functions ──────────────────────────────────────────────────

export async function createNotification(data: {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'repost' | 'engagement';
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorProfileImage: string;
  postId?: string;
  message?: string;
}): Promise<void> {
  try {
    await firestore().collection('notifications').add({
      userId: data.userId,
      type: data.type,
      actorId: data.actorId,
      actorName: data.actorName,
      actorUsername: data.actorUsername,
      actorProfileImage: data.actorProfileImage,
      postId: data.postId || null,
      message: data.message || '',
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn('[notifications] Failed to create notification:', err);
  }
}

export async function fetchNotifications(userId: string): Promise<Black94Notification[]> {
  const snap = await firestore()
    .collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map(docToNotification);
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await firestore().collection('notifications').doc(notifId).update({ read: true });
}

// ── Search Functions ────────────────────────────────────────────────────────

export async function searchUsers(queryStr: string, limitCount: number): Promise<Black94User[]> {
  const qUsername = firestore()
    .collection('users')
    .where('usernameLower', '>=', queryStr.toLowerCase())
    .where('usernameLower', '<=', queryStr.toLowerCase() + '\uf8ff')
    .limit(limitCount);

  const qDisplay = firestore()
    .collection('users')
    .where('displayName', '>=', queryStr)
    .where('displayName', '<=', queryStr + '\uf8ff')
    .limit(limitCount);

  const [snapUsername, snapDisplay] = await Promise.all([qUsername.get(), qDisplay.get()]);

  const userMap = new Map<string, Black94User>();
  for (const docSnap of snapUsername.docs) {
    userMap.set(docSnap.id, docToBlack94User(docSnap));
  }
  for (const docSnap of snapDisplay.docs) {
    if (!userMap.has(docSnap.id)) {
      userMap.set(docSnap.id, docToBlack94User(docSnap));
    }
  }

  return Array.from(userMap.values()).slice(0, limitCount);
}

export async function searchPosts(queryStr: string, limitCount: number): Promise<Post[]> {
  const snap = await firestore()
    .collection('posts')
    .where('caption', '>=', queryStr)
    .where('caption', '<=', queryStr + '\uf8ff')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snap.docs.map(docToPost);
}

// ── Story Functions ─────────────────────────────────────────────────────────

export interface StoryAuthorInfo {
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
}

/**
 * Create a new story in Firestore.
 * If authorInfo is provided, skips the extra getUser() Firestore read for speed.
 */
export async function createStory(
  authorId: string,
  data: {
    format: string;
    content: string;
    mediaUrl?: string;
    language?: string;
    pollOptions?: Array<{ id: string; text: string; votes: number; percentage: number }>;
    voiceUrl?: string;
    voiceDuration?: number;
    voiceWaveform?: number[];
    festivalTemplate?: { id: string; name: string; gradient: string; emoji: string; textColor: string };
    cricketData?: { team1: string; team2: string; team1Score: string; team2Score: string; overs: string; venue: string; status: string };
    audience?: string;
    expiry?: string;
  },
  authorInfo?: StoryAuthorInfo,
): Promise<Story> {
  const author = authorInfo ?? await getUser(authorId);
  if (!author) throw new Error('Author not found');

  const username = typeof author === 'string' ? author : author.username;
  const displayName = typeof author === 'string' ? author : author.displayName;
  const profileImage = typeof author === 'string' ? '' : author.profileImage;
  const isVerified = typeof author === 'string' ? false : author.isVerified;

  const storyRef = await firestore().collection('stories').add({
    authorId,
    authorUsername: username,
    authorDisplayName: displayName,
    authorProfileImage: profileImage,
    authorIsVerified: isVerified,
    format: data.format,
    content: data.content,
    mediaUrl: data.mediaUrl ?? '',
    language: data.language ?? 'en',
    pollOptions: data.pollOptions ?? null,
    voiceUrl: data.voiceUrl ?? null,
    voiceDuration: data.voiceDuration ?? null,
    voiceWaveform: data.voiceWaveform ?? null,
    festivalTemplate: data.festivalTemplate ?? null,
    cricketData: data.cricketData ?? null,
    audience: data.audience ?? 'everyone',
    expiry: data.expiry ?? '24h',
    viewCount: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  const snap = await storyRef.get();
  return docToStory(snap);
}

/**
 * Fetch recent stories from Firestore (for the story feed).
 */
export async function fetchStories(limitCount: number): Promise<Story[]> {
  const snap = await firestore()
    .collection('stories')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snap.docs.map(docToStory);
}

// ── Social-style comment functions (top-level collection) ──────────────────────

/**
 * Fetch comments for a post from the top-level "post_comments" collection.
 * Returns enriched CommentData including authorProfileImage, authorIsVerified, authorBadge.
 */
export async function fetchPostComments(postId: string): Promise<CommentData[]> {
  try {
    const snap = await firestore()
      .collection('post_comments')
      .where('postId', '==', postId)
      .limit(50)
      .get();

    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data()!;
        return {
          id: docSnap.id,
          postId: d.postId ?? postId,
          authorId: d.authorId ?? '',
          authorUsername: d.authorUsername ?? '',
          authorDisplayName: d.authorDisplayName ?? '',
          authorProfileImage: d.authorProfileImage ?? '',
          authorIsVerified: d.authorIsVerified ?? false,
          authorBadge: d.authorBadge ?? '',
          content: d.content ?? '',
          createdAt: tsToISO(d.createdAt),
        };
      })
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  } catch (err) {
    console.error('[db] fetchPostComments failed:', err);
    return [];
  }
}

export interface CommentData {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  authorBadge: string;
  content: string;
  createdAt: string;
}

/**
 * Add a comment to the top-level "post_comments" collection.
 */
export async function addPostComment(
  postId: string,
  userId: string,
  content: string,
  authorData: {
    username: string;
    displayName: string;
    profileImage: string;
    isVerified?: boolean;
    badge?: string;
  },
): Promise<CommentData> {
  try {
    const commentRef = await firestore().collection('post_comments').add({
      postId,
      authorId: userId,
      authorUsername: authorData.username,
      authorDisplayName: authorData.displayName,
      authorProfileImage: authorData.profileImage,
      authorIsVerified: authorData.isVerified ?? false,
      authorBadge: authorData.badge ?? '',
      content,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Update comment count on parent post (non-critical)
    try {
      await firestore().collection('posts').doc(postId).update({
        commentCount: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('[db] addPostComment: count update failed (non-critical):', err);
    }

    const snap = await commentRef.get();
    const d = snap.data()!;
    return {
      id: snap.id,
      postId,
      authorId: userId,
      authorUsername: authorData.username,
      authorDisplayName: authorData.displayName,
      authorProfileImage: authorData.profileImage,
      authorIsVerified: authorData.isVerified ?? false,
      authorBadge: authorData.badge ?? '',
      content,
      createdAt: tsToISO(d.createdAt),
    };
  } catch (err) {
    console.error('[db] addPostComment failed:', err);
    throw err;
  }
}

// ── Story Groups (grouped for story feed) ─────────────────────────────────────

export interface StoryGroup {
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  verified: boolean;
  stories: Pick<Story, 'id' | 'mediaUrl' | 'content' | 'format' | 'createdAt'>[];
  latestCreatedAt: string;
}

/**
 * Fetch recent stories grouped by author for the story feed.
 */
export async function fetchStoryGroups(): Promise<StoryGroup[]> {
  const snap = await firestore()
    .collection('stories')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  const now = Date.now();
  const groupMap = new Map<string, StoryGroup>();

  for (const docSnap of snap.docs) {
    const d = docSnap.data()!;
    const createdAt = tsToISO(d.createdAt);
    const expiresAt = d.expiry === '24h'
      ? new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
      : createdAt;

    if (new Date(expiresAt).getTime() < now) continue;

    const userId: string = d.authorId ?? '';

    if (!groupMap.has(userId)) {
      groupMap.set(userId, {
        userId,
        username: d.authorUsername ?? '',
        displayName: d.authorDisplayName ?? '',
        profileImage: d.authorProfileImage ?? '',
        verified: d.authorIsVerified ?? false,
        stories: [],
        latestCreatedAt: createdAt,
      });
    }

    groupMap.get(userId)!.stories.push({
      id: docSnap.id,
      mediaUrl: d.mediaUrl ?? '',
      content: d.content ?? '',
      format: d.format ?? 'text',
      createdAt,
    });
  }

  return Array.from(groupMap.values())
    .map((g) => ({
      ...g,
      stories: [...g.stories].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }))
    .sort(
      (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime(),
    );
}

// ── Bookmark Feed (fetch bookmarked posts) ───────────────────────────────────

/**
 * Fetch posts that the user has bookmarked.
 */
export async function fetchBookmarkedPosts(userId: string, limitCount: number = 20): Promise<Post[]> {
  const bookmarksSnap = await firestore()
    .collection('post_bookmarks')
    .where('userId', '==', userId)
    .limit(limitCount)
    .get();

  const postIds = bookmarksSnap.docs.map((d) => d.data()?.postId).filter(Boolean);
  if (postIds.length === 0) return [];

  const CHUNK_SIZE = 30;
  const posts: Post[] = [];

  for (let i = 0; i < postIds.length; i += CHUNK_SIZE) {
    const chunk = postIds.slice(i, i + CHUNK_SIZE);
    const postsSnap = await firestore()
      .collection('posts')
      .where(firestore.FieldPath.documentId(), 'in', chunk)
      .get();
    postsSnap.docs.forEach((d) => posts.push(docToPost(d)));
  }

  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ── Block Functions ─────────────────────────────────────────────────────────

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  await firestore()
    .collection('blocked_users')
    .doc(`${blockerId}_${blockedId}`)
    .set({
      blockerId,
      blockedId,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await firestore()
    .collection('blocked_users')
    .doc(`${blockerId}_${blockedId}`)
    .delete();
}

export async function fetchBlockedUsers(blockerId: string): Promise<string[]> {
  const snap = await firestore()
    .collection('blocked_users')
    .where('blockerId', '==', blockerId)
    .get();
  return snap.docs.map((d) => d.data()?.blockedId).filter(Boolean);
}

// ── Image Upload ────────────────────────────────────────────────────────────

/**
 * Upload a local image file to Firebase Storage and return its download URL.
 */
export async function uploadImage(uri: string, path: string): Promise<string> {
  const ref = storage().ref(path);
  await ref.putFile(uri);
  return await ref.getDownloadURL();
}

// ── Story Authors (grouped for story row) ─────────────────────────────────────

export interface StoryAuthor {
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  authorBadge: string;
  storyCount: number;
  hasUnseen: boolean;
}

/**
 * Fetch story authors (grouped) for the story row.
 * Returns one entry per author with story count.
 */
export async function fetchStoryAuthors(): Promise<StoryAuthor[]> {
  const snap = await firestore()
    .collection('stories')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  if (snap.empty) return [];

  // Group by author
  const authorMap = new Map<
    string,
    {
      authorId: string;
      authorUsername: string;
      authorDisplayName: string;
      authorProfileImage: string;
      authorIsVerified: boolean;
      authorBadge: string;
      latestCreatedAt: number;
    }
  >();

  for (const docSnap of snap.docs) {
    const d = docSnap.data()!;
    const authorId = d.authorId ?? '';
    if (!authorId) continue;

    const existing = authorMap.get(authorId);
    const createdAt = tsToISO(d.createdAt);

    if (!existing || new Date(createdAt).getTime() > existing.latestCreatedAt) {
      authorMap.set(authorId, {
        authorId,
        authorUsername: d.authorUsername ?? '',
        authorDisplayName: d.authorDisplayName ?? '',
        authorProfileImage: d.authorProfileImage ?? '',
        authorIsVerified: d.authorIsVerified ?? false,
        authorBadge: d.authorBadge ?? '',
        latestCreatedAt: new Date(createdAt).getTime(),
      });
    }
  }

  const countMap = new Map<string, number>();
  for (const docSnap of snap.docs) {
    const aid = docSnap.data()?.authorId ?? '';
    if (aid) countMap.set(aid, (countMap.get(aid) ?? 0) + 1);
  }

  return Array.from(authorMap.values())
    .sort((a, b) => b.latestCreatedAt - a.latestCreatedAt)
    .map((a) => ({
      ...a,
      storyCount: countMap.get(a.authorId) ?? 1,
      hasUnseen: true,
    }));
}

// ── Utility Functions ───────────────────────────────────────────────────────

/** Get the current authenticated user's UID, or null if not signed in */
export function getCurrentUserId(): string | null {
  return auth().currentUser?.uid ?? null;
}

/** Delete a chat and all its messages */
export async function deleteChat(chatId: string): Promise<void> {
  // Delete all messages in the chat
  const messagesSnap = await firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .get();

  if (!messagesSnap.empty) {
    const batch = firestore().batch();
    messagesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  // Delete the chat document itself
  await firestore().collection('chats').doc(chatId).delete();
}
