import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// ── Props ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// ── Icon helper — uses Ionicons instead of emoji ─────────────────────────────

function renderIcon(icon?: string): React.ReactElement | null {
  let iconName: string = 'ellipse-outline';
  switch (icon) {
    case 'feed':
      iconName = 'newspaper-outline';
      break;
    case 'comment':
      iconName = 'chatbubble-outline';
      break;
    case 'search':
      iconName = 'search-outline';
      break;
    case 'bookmark':
      iconName = 'bookmark-outline';
      break;
    case 'notification':
      iconName = 'notifications-outline';
      break;
    case 'user':
      iconName = 'person-outline';
      break;
    case 'story':
      iconName = 'camera-outline';
      break;
    default:
      return null;
  }
  return (
    <View style={styles.iconCircle}>
      <Icon name={iconName} size={36} color="#e7e9ea" />
    </View>
  );
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
    backgroundColor: '#16181c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
});

export default EmptyState;
