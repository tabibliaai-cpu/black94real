import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// ── Theme colors ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#16181c',
  text: '#e7e9ea',
  textSecondary: '#94a3b8',
  green: '#10b981',
  primary: '#FFFFFF',
  gold: '#f59e0b',
} as const;

// ── Props ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  online?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

function getInitial(name?: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 40,
  borderWidth = 0,
  borderColor,
  online = false,
}) => {
  const initial = getInitial(name);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {(borderWidth > 0 || borderColor) && (
        <View
          style={[
            styles.border,
            {
              width: size + (borderWidth || 2) * 2,
              height: size + (borderWidth || 2) * 2,
              borderRadius: (size + (borderWidth || 2) * 2) / 2,
              borderColor: borderColor ?? COLORS.primary,
              borderWidth: borderWidth || 2,
            },
          ]}
        />
      )}

      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
          accessible
          accessibilityLabel={name ?? 'User avatar'}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.initial,
              {
                fontSize: Math.max(size * 0.4, 12),
                lineHeight: Math.max(size * 0.4, 12),
              },
            ]}
          >
            {initial}
          </Text>
        </View>
      )}

      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: size * 0.22,
              height: size * 0.22,
              borderRadius: size * 0.11,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  border: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: COLORS.bg,
  },
  fallback: {
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: '#000000',
  },
});

export default memo(Avatar);
