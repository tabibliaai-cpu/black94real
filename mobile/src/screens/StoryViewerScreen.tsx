import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { Story, fetchStories } from '../lib/db';
import { Colors, Spacing, BorderRadius } from '../theme';
import { formatDistanceToNow } from 'date-fns';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

type RootStackParamList = {
  StoryViewer: { storyIds?: string[]; startIndex?: number; storyGroupId?: string };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StoryViewer'>;
  route: RouteProp<RootStackParamList, 'StoryViewer'>;
};

interface StoryItem {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorProfileImage: string;
  authorIsVerified: boolean;
  format: string;
  content: string;
  mediaUrl: string;
  pollOptions?: Array<{ id: string; text: string; votes: number; percentage: number }>;
  createdAt: string;
}

const StoryViewerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { storyIds, startIndex = 0, storyGroupId } = route.params;

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<StoryItem['pollOptions']>(undefined);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const panResponderRef = useRef<any>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load stories
  useEffect(() => {
    const loadStories = async () => {
      try {
        let allStories = await fetchStories(100);

        if (storyIds && storyIds.length > 0) {
          allStories = allStories.filter((s) => storyIds.includes(s.id));
          allStories.sort((a, b) => {
            const aIdx = storyIds.indexOf(a.id);
            const bIdx = storyIds.indexOf(b.id);
            return aIdx - bIdx;
          });
        } else if (storyGroupId) {
          allStories = allStories.filter((s) => s.authorId === storyGroupId);
        }

        const items: StoryItem[] = allStories.map((s) => ({
          id: s.id,
          authorId: s.authorId,
          authorUsername: s.authorUsername,
          authorDisplayName: s.authorDisplayName,
          authorProfileImage: s.authorProfileImage,
          authorIsVerified: s.authorIsVerified,
          format: s.format,
          content: s.content,
          mediaUrl: s.mediaUrl,
          pollOptions: s.pollOptions,
          createdAt: s.createdAt,
        }));

        setStories(items);
      } catch (e) {
        console.warn('[StoryViewerScreen] load error:', e);
      }
    };
    loadStories();
  }, [storyIds, storyGroupId]);

  // Reset state when story changes
  useEffect(() => {
    const currentStory = stories[currentIndex];
    if (currentStory) {
      setSelectedPollOption(null);
      setPollOptions(currentStory.pollOptions);
    }
  }, [currentIndex, stories]);

  // Progress bar animation
  useEffect(() => {
    if (stories.length === 0 || isPaused) {
      Animated.timing(progressAnim).stop();
      return;
    }

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });

    return () => {
      progressAnim.stopAnimation();
    };
  }, [currentIndex, stories.length, isPaused]);

  // Pan responder for swipe dismiss
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 30 && Math.abs(gestureState.dx) < 50;
      },
      onPanResponderMove: (_, gestureState) => {
        // Could add visual feedback here
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SCREEN_HEIGHT * 0.25) {
          navigation.goBack();
        }
      },
    });
  }, [navigation]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      progressAnim.setValue(0);
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigation.goBack();
    }
  }, [currentIndex, stories.length, navigation, progressAnim]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      progressAnim.setValue(0);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, progressAnim]);

  const handleTapLeft = useCallback(() => {
    goPrev();
  }, [goPrev]);

  const handleTapRight = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleLongPressStart = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handlePollVote = useCallback((optionId: string) => {
    if (selectedPollOption) return; // Already voted
    setSelectedPollOption(optionId);
    setPollOptions((prev) =>
      prev?.map((opt) =>
        opt.id === optionId
          ? { ...opt, votes: opt.votes + 1 }
          : opt,
      ),
    );
  }, [selectedPollOption]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const currentStory = stories[currentIndex];

  if (!currentStory) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isTextStory = currentStory.format === 'text';
  const isPollStory = currentStory.format === 'poll' && currentStory.pollOptions;
  const isImageStory = !isTextStory && !isPollStory && currentStory.mediaUrl;

  // Group stories by author for progress bars
  const progressBars = stories.map((_, i) => i);

  // Compute poll totals
  const totalVotes = pollOptions?.reduce((sum, o) => sum + o.votes, 0) ?? 0;

  return (
    <View style={styles.container} {...(panResponderRef.current?.panHandlers ?? {})}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background */}
      {isTextStory ? (
        <LinearGradient
          colors={parseGradientColors(currentStory.mediaUrl)}
          style={styles.gradientBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {currentStory.content ? (
            <Text style={styles.textStoryContent}>{currentStory.content}</Text>
          ) : null}
        </LinearGradient>
      ) : isImageStory ? (
        <Image
          source={{ uri: currentStory.mediaUrl }}
          style={styles.imageBg}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.gradientBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Dark overlay */}
      {!isTextStory && (
        <View style={styles.darkOverlay} />
      )}

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {progressBars.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            {i < currentIndex ? (
              <View style={[styles.progressFill, styles.progressComplete]} />
            ) : i === currentIndex ? (
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>

      {/* Author Bar */}
      <View style={styles.authorBar}>
        <View style={styles.authorInfo}>
          <Image
            source={
              currentStory.authorProfileImage
                ? { uri: currentStory.authorProfileImage }
                : { uri: 'https://via.placeholder.com/80/333/ccc?text=A' }
            }
            style={styles.authorAvatar}
          />
          <View style={styles.authorTextContainer}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{currentStory.authorDisplayName}</Text>
              {currentStory.authorIsVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.authorUsername}>@{currentStory.authorUsername}</Text>
          </View>
        </View>
        <View style={styles.authorMeta}>
          <Text style={styles.storyTime}>
            {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: false })}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content / Tap Zones */}
      {!isTextStory && !isPollStory && (
        <View style={styles.tapZoneContainer}>
          <TouchableOpacity
            style={styles.tapZone}
            onPress={handleTapLeft}
            activeOpacity={1}
            onPressIn={handleLongPressStart}
            onPressOut={handleLongPressEnd}
          />
          <TouchableOpacity
            style={styles.tapZone}
            onPress={handleTapRight}
            activeOpacity={1}
            onPressIn={handleLongPressStart}
            onPressOut={handleLongPressEnd}
          />
        </View>
      )}

      {/* Poll Story Content */}
      {isPollStory && pollOptions && (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{currentStory.content}</Text>
          {pollOptions.map((option) => {
            const isSelected = selectedPollOption === option.id;
            const votePercent =
              totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const hasVoted = !!selectedPollOption;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  isSelected && styles.pollOptionSelected,
                  hasVoted && styles.pollOptionVoted,
                ]}
                onPress={() => handlePollVote(option.id)}
                activeOpacity={0.8}
                disabled={hasVoted}
              >
                {hasVoted && (
                  <View
                    style={[
                      styles.pollOptionFill,
                      {
                        width: `${votePercent}%`,
                      },
                    ]}
                  />
                )}
                <View style={styles.pollOptionContent}>
                  <Text
                    style={[
                      styles.pollOptionText,
                      hasVoted && isSelected && styles.pollOptionTextSelected,
                    ]}
                  >
                    {option.text}
                  </Text>
                  {hasVoted && (
                    <Text style={styles.pollVotePercent}>{votePercent}%</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.pollVoteCount}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Swipe up hint */}
      <View style={styles.swipeHintContainer}>
        <Text style={styles.swipeHint}>Swipe up to dismiss</Text>
      </View>

      {/* Pause indicator */}
      {isPaused && (
        <View style={styles.pauseIndicator}>
          <Text style={styles.pauseText}>⏸ Paused</Text>
        </View>
      )}
    </View>
  );
};

function parseGradientColors(mediaUrl: string): string[] {
  if (!mediaUrl || mediaUrl.startsWith('http')) {
    return ['#667eea', '#764ba2'];
  }
  const gradients: Record<string, string[]> = {
    sunset: ['#f093fb', '#f5576c'],
    ocean: ['#4facfe', '#00f2fe'],
    forest: ['#43e97b', '#38f9d7'],
    fire: ['#fa709a', '#fee140'],
    night: ['#a18cd1', '#fbc2eb'],
    purple: ['#667eea', '#764ba2'],
    blue: ['#2193b0', '#6dd5ed'],
    dark: ['#232526', '#414345'],
  };
  return gradients[mediaUrl] ?? ['#667eea', '#764ba2'];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBg: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  textStoryContent: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
    lineHeight: 42,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: 3,
    zIndex: 20,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: Colors.whiteAlpha20,
    borderRadius: 1.25,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 1.25,
  },
  progressComplete: {
    width: '100%',
  },
  authorBar: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: Colors.surfaceLight,
  },
  authorTextContainer: {
    gap: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '700',
  },
  authorUsername: {
    fontSize: 11,
    color: Colors.whiteAlpha80,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  storyTime: {
    fontSize: 12,
    color: Colors.whiteAlpha60,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.whiteAlpha20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.white,
  },
  tapZoneContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  tapZone: {
    flex: 1,
  },
  pollContainer: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 15,
  },
  pollQuestion: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pollOption: {
    backgroundColor: Colors.whiteAlpha10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.whiteAlpha20,
  },
  pollOptionSelected: {
    borderColor: Colors.primary,
  },
  pollOptionVoted: {
    borderColor: Colors.whiteAlpha20,
  },
  pollOptionFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: Colors.whiteAlpha20,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pollOptionText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '500',
  },
  pollOptionTextSelected: {
    fontWeight: '700',
  },
  pollVotePercent: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.whiteAlpha80,
  },
  pollVoteCount: {
    fontSize: 12,
    color: Colors.whiteAlpha60,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  swipeHintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  swipeHint: {
    fontSize: 12,
    color: Colors.whiteAlpha40,
  },
  pauseIndicator: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  pauseText: {
    fontSize: 16,
    color: Colors.whiteAlpha80,
  },
});

export default StoryViewerScreen;
