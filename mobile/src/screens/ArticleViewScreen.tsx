/**
 * ArticleViewScreen.tsx — View a published article
 *
 * Fetches article from Firestore 'articles' collection.
 * Renders HTML content as plain text (strips tags).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppStore, type Article } from '../stores/app';
import firestore from '@react-native-firebase/firestore';
import { auth } from '../lib/firebase';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

type ArticleViewRouteProp = RouteProp<RootStackParamList, 'ArticleView'>;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip HTML tags and convert basic formatting to React Native text */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '  • ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ArticleViewScreen() {
  const route = useRoute<ArticleViewRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { articleId } = route.params;
  const currentUser = useAppStore((s) => s.user);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // ── Fetch article ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const snap = await firestore()
          .collection('articles')
          .doc(articleId)
          .get();

        if (!snap.exists) {
          Alert.alert('Not Found', 'This article does not exist.');
          navigation.goBack();
          return;
        }

        const d = snap.data()!;
        const a: Article = {
          id: snap.id,
          authorId: d.authorId ?? '',
          title: d.title ?? '',
          content: d.content ?? '',
          coverImage: d.coverImage ?? '',
          factCheck: d.factCheck ?? '',
          isPublished: d.isPublished ?? false,
          views: d.views ?? 0,
          createdAt: (() => {
            const t = d.createdAt;
            if (t && typeof t === 'object' && 'seconds' in t) {
              return new Date((t as any).seconds * 1000).toISOString();
            }
            return String(t ?? new Date().toISOString());
          })(),
          updatedAt: String(d.updatedAt ?? ''),
          author: d.authorName
            ? {
                id: d.authorId ?? '',
                email: '',
                username: d.authorUsername ?? '',
                displayName: d.authorName,
                bio: '',
                profileImage: d.authorImage ?? '',
                coverImage: '',
                role: 'personal' as const,
                badge: '',
                subscription: '',
                isVerified: false,
                accountType: 'personal' as const,
                accountLocked: false,
                nameVisibility: 'public',
                dmPermission: 'all',
                searchVisibility: 'public',
                paidChatEnabled: false,
                paidChatPrice: 0,
                createdAt: '',
              }
            : undefined,
        };

        setArticle(a);
        setLikeCount(d.likeCount ?? 0);
        setCommentCount(d.commentCount ?? 0);

        // Increment view count (fire-and-forget)
        firestore()
          .collection('articles')
          .doc(articleId)
          .update({
            views: firestore.FieldValue.increment(1),
          })
          .catch(() => {});
      } catch (err) {
        console.error('[ArticleViewScreen] loadArticle error:', err);
        Alert.alert('Error', 'Failed to load article.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleId, navigation]);

  // ── Toggle like ────────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const likeRef = firestore()
      .collection('articles')
      .doc(articleId)
      .collection('likes')
      .doc(userId);

    likeRef.get().then((snap) => {
      if (snap.exists) {
        likeRef.delete();
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        firestore()
          .collection('articles')
          .doc(articleId)
          .update({ likeCount: firestore.FieldValue.increment(-1) })
          .catch(() => {});
      } else {
        likeRef.set({
          userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        setIsLiked(true);
        setLikeCount((c) => c + 1);
        firestore()
          .collection('articles')
          .doc(articleId)
          .update({ likeCount: firestore.FieldValue.increment(1) })
          .catch(() => {});
      }
    });
  }, [currentUser, articleId]);

  // ── Toggle bookmark ────────────────────────────────────────────────────
  const handleBookmark = useCallback(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const bmRef = firestore()
      .collection('article_bookmarks')
      .doc(`${articleId}_${userId}`);

    bmRef.get().then((snap) => {
      if (snap.exists) {
        bmRef.delete();
        setIsBookmarked(false);
      } else {
        bmRef.set({
          articleId,
          userId,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        setIsBookmarked(true);
      }
    });
  }, [currentUser, articleId]);

  // ── Share ───────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: article?.title ?? 'Article',
        message: article?.title
          ? `${article.title}\n\nRead on Black94: https://black94.app/articles/${articleId}`
          : `Check out this article on Black94: https://black94.app/articles/${articleId}`,
      });
    } catch (err) {
      // User cancelled
    }
  }, [article, articleId]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!article) return null;

  const plainContent = stripHtml(article.content);
  const readTime = estimateReadTime(plainContent);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Cover image */}
        {article.coverImage ? (
          <Image
            source={{ uri: article.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Fact check badge */}
        {article.factCheck ? (
          <View style={styles.factCheckBadge}>
            <Icon name="shield-checkmark" size={14} color={colors.success} />
            <Text style={styles.factCheckText}>Fact Checked</Text>
          </View>
        ) : null}

        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            {article.author?.profileImage ? (
              <Image
                source={{ uri: article.author.profileImage }}
                style={styles.authorAvatarImage}
              />
            ) : (
              <Text style={styles.authorAvatarInitial}>
                {(article.author?.displayName ?? 'U')[0].toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {article.author?.displayName ?? 'Unknown Author'}
            </Text>
            <Text style={styles.authorMeta}>
              {formatDate(article.createdAt)} · {readTime} min read
            </Text>
          </View>
        </View>

        {/* Article body */}
        <Text style={styles.bodyText}>{plainContent}</Text>

        {/* Views count */}
        <View style={styles.viewsRow}>
          <Icon name="eye-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.viewsText}>
            {article.views.toLocaleString()} views
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLike}
          activeOpacity={0.7}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? colors.error : colors.textSecondary}
          />
          <Text style={[styles.actionCount, isLiked && { color: colors.error }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => {
            // Navigate to comments or open comment sheet
            Alert.alert('Comments', `${commentCount} comments`);
          }}>
          <Icon name="chatbubble-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.actionCount}>{commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          activeOpacity={0.7}>
          <Icon name="share-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleBookmark}
          activeOpacity={0.7}>
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? colors.warning : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  coverImage: {
    width: '100%',
    height: 240,
    backgroundColor: colors.surfaceElevated,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 34,
    padding: 16,
    paddingBottom: 8,
  },
  factCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  factCheckText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  authorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorAvatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  authorMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textSecondary,
    padding: 16,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  viewsText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  actionBtn: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  actionCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
    fontWeight: '600',
  },
});
