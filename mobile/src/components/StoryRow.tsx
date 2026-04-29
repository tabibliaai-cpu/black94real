import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { StoryAuthor } from '../navigation/types';
import Avatar from './Avatar';

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#000000',
  surface: '#16181c',
  textPrimary: '#e7e9ea',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#FFFFFF',
  gray: 'rgba(255, 255, 255, 0.15)',
  border: 'rgba(255, 255, 255, 0.06)',
} as const;

const AVATAR_SIZE = 64;
const RING_WIDTH = 3;
const YOUR_STORY_WIDTH = AVATAR_SIZE + RING_WIDTH * 2;

// ── Props ────────────────────────────────────────────────────────────────────

interface StoryRowProps {
  stories: StoryAuthor[];
  loading?: boolean;
  currentUserId?: string;
}

// ── Sub-components ───────────────────────────────────────────────────────────

const StorySkeleton: React.FC = () => (
  <View style={styles.storyItem}>
    <View
      style={[
        styles.skeletonRing,
        {
          width: YOUR_STORY_WIDTH,
          height: YOUR_STORY_WIDTH,
          borderRadius: YOUR_STORY_WIDTH / 2,
        },
      ]}
    />
    <View style={[styles.skeletonText, { width: 52, marginTop: 6 }]} />
  </View>
);

const YourStoryItem: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.storyItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.yourStoryRing,
        {
          width: YOUR_STORY_WIDTH,
          height: YOUR_STORY_WIDTH,
          borderRadius: YOUR_STORY_WIDTH / 2,
        },
      ]}
    >
      <View
        style={[
          styles.yourStoryInner,
          {
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
          },
        ]}
      >
        <Text style={styles.plusIcon}>+</Text>
      </View>
    </View>
    <Text style={styles.storyLabel} numberOfLines={1}>
      Your Story
    </Text>
  </TouchableOpacity>
);

const StoryItem: React.FC<{
  story: StoryAuthor;
  onPress: () => void;
}> = ({ story, onPress }) => {
  const ringColor = story.hasUnseen ? COLORS.primary : COLORS.gray;

  return (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.storyRing,
          {
            width: YOUR_STORY_WIDTH,
            height: YOUR_STORY_WIDTH,
            borderRadius: YOUR_STORY_WIDTH / 2,
            borderColor: ringColor,
          },
        ]}
      >
        <Avatar
          uri={story.authorProfileImage}
          name={story.authorDisplayName}
          size={AVATAR_SIZE - 2}
          borderWidth={2}
          borderColor="#000000"
        />
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>
        {story.authorDisplayName || story.authorUsername}
      </Text>
    </TouchableOpacity>
  );
};

// ── Component ────────────────────────────────────────────────────────────────

const StoryRow: React.FC<StoryRowProps> = ({
  stories,
  loading = false,
  currentUserId,
}) => {
  const navigation = useNavigation();

  const handleYourStory = useCallback(() => {
    // Navigate to story creation or camera
    (navigation.navigate as any)('StoryViewer', { authorId: currentUserId ?? '' });
  }, [navigation, currentUserId]);

  const handleStoryPress = useCallback(
    (story: StoryAuthor) => {
      (navigation.navigate as any)('StoryViewer', { authorId: story.authorId });
    },
    [navigation],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => (
            <StorySkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (!loading && stories.length === 0) {
    // Show only "Your Story" even if no stories
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          <YourStoryItem onPress={handleYourStory} />
        </View>
      </View>
    );
  }

  const data = [{ _key: 'your-story', _type: 'yours' as const }, ...stories.map((s, i) => ({ _key: s.authorId + i, _type: 'story' as const, story: s }))];

  const renderItem = ({ item }: { item: { _key: string; _type: 'yours' | 'story'; story?: StoryAuthor } }) => {
    if (item._type === 'yours') {
      return <YourStoryItem onPress={handleYourStory} />;
    }
    if (item._type === 'story' && item.story) {
      return (
        <StoryItem
          story={item.story}
          onPress={() => handleStoryPress(item.story!)}
        />
      );
    }
    return null;
  };

  const keyExtractor = (item: { _key: string }) => item._key;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  storyItem: {
    alignItems: 'center',
    width: AVATAR_SIZE + 24,
  },
  yourStoryRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: COLORS.surface,
  },
  yourStoryInner: {
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '300',
  },
  storyRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: RING_WIDTH,
  },
  storyLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: AVATAR_SIZE + 20,
  },
  skeletonRing: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skeletonText: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default React.memo(StoryRow);
