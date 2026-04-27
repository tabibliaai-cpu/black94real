import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImage } from '../lib/db';
import { colors } from '../theme/colors';

interface ChatInputBarProps {
  onSend: (text: string, messageType: string, mediaUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  chatId: string;
}

const MAX_INPUT_HEIGHT = 120; // ~5 lines
const MIN_INPUT_HEIGHT = 40;

export default function ChatInputBar({
  onSend,
  onTyping,
  disabled = false,
  chatId,
}: ChatInputBarProps) {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animatedHeight = useSharedValue(MIN_INPUT_HEIGHT + 24); // 24 for padding/borders

  const canSend = useMemo(() => {
    return text.trim().length > 0 || mediaUri !== null;
  }, [text, mediaUri]);

  // ── Update animated height when input height changes ───────────────────
  useEffect(() => {
    animatedHeight.value = withSpring(inputHeight + 24, {
      damping: 20,
      stiffness: 200,
    });
  }, [inputHeight, animatedHeight]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value + (mediaUri ? 80 : 0),
    };
  });

  // ── Typing indicator with debounce ─────────────────────────────────────
  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    },
    [onTyping],
  );

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!canSend || disabled || isUploading) return;

    // If we have media, upload first
    if (mediaUri && mediaType) {
      setIsUploading(true);
      try {
        const fileName = `chat_media/${chatId}/${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
        const downloadUrl = await uploadImage(mediaUri, fileName);
        onSend('', mediaType, downloadUrl);
      } catch (err) {
        console.error('[ChatInputBar] upload error:', err);
      } finally {
        setIsUploading(false);
        setMediaUri(null);
        setMediaType(null);
      }
    } else if (text.trim()) {
      onSend(text.trim(), 'text');
      setText('');
      setInputHeight(MIN_INPUT_HEIGHT);
    }

    // Dismiss keyboard
    Keyboard.dismiss();
    onTyping(false);
  }, [canSend, disabled, isUploading, mediaUri, mediaType, text, chatId, onSend, onTyping]);

  // ── Pick image/video ───────────────────────────────────────────────────
  const handleAttachment = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.8,
        maxWidth: 1280,
        maxHeight: 1280,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error('[ChatInputBar] image picker error:', response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        const type = asset.type?.startsWith('video') ? 'video' : 'image';
        setMediaUri(asset.uri);
        setMediaType(type);
      },
    );
  }, []);

  // ── Remove selected media ──────────────────────────────────────────────
  const removeMedia = useCallback(() => {
    setMediaUri(null);
    setMediaType(null);
  }, []);

  // ── Handle input size change ───────────────────────────────────────────
  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(
        Math.max(e.nativeEvent.contentSize.height, MIN_INPUT_HEIGHT),
        MAX_INPUT_HEIGHT,
      );
      setInputHeight(newHeight);
    },
    [],
  );

  // ── Cleanup ────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Media preview */}
      {mediaUri && (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: mediaUri }} style={styles.mediaThumbnail} resizeMode="cover" />
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.uploadingText}>Sending...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
            <Icon name="close" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        {/* Emoji button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            // Placeholder for emoji picker integration
            // Could open a modal or bottom sheet with emoji picker
          }}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Icon name="happy-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Attachment button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleAttachment}
          disabled={disabled}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Icon name="attach" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { height: inputHeight }]}
            value={text}
            onChangeText={handleTextChange}
            onContentSizeChange={handleContentSizeChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            editable={!disabled}
            underlineColorAndroid="transparent"
          />
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend && !disabled && !isUploading
              ? styles.sendButtonActive
              : styles.sendButtonInactive,
          ]}
          onPress={handleSend}
          disabled={!canSend || disabled || isUploading}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon
              name={canSend ? 'send' : 'mic'}
              size={20}
              color={canSend ? colors.white : colors.textTertiary}
            />
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Need Text import for the uploading text ────────────────────────────────
import { Text } from 'react-native';

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  mediaPreview: {
    marginBottom: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    height: 70,
    width: 70,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  mediaThumbnail: {
    width: 70,
    height: 70,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    color: colors.white,
    fontSize: 10,
    marginTop: 4,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  iconButton: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  textInput: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlignVertical: 'center',
    paddingVertical: 8,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: colors.surfaceElevated,
  },
});
