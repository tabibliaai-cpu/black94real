import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ── Props ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// ── Icon helper ──────────────────────────────────────────────────────────────

function renderIcon(icon?: string): React.ReactElement | null {
  switch (icon) {
    case 'feed':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>💬</Text>
        </View>
      );
    case 'comment':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>💭</Text>
        </View>
      );
    case 'search':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔍</Text>
        </View>
      );
    case 'bookmark':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔖</Text>
        </View>
      );
    case 'notification':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🔔</Text>
        </View>
      );
    case 'user':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>👤</Text>
        </View>
      );
    case 'story':
      return (
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📸</Text>
        </View>
      );
    default:
      return null;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {icon ? renderIcon(icon) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    backgroundColor: '#000000',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e7e9ea',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default EmptyState;
