import { StyleSheet } from 'react-native';

// ─── Color tokens (Dark theme — primary) ─────────────────────────────────────
export const Colors = {
  background: '#000000',
  surface: '#111111',
  surfaceElevated: '#1a1a1a',
  surfaceHover: '#222222',
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#60a5fa',
  secondary: '#8b5cf6',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: '#27272a',
  borderLight: '#3f3f46',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  like: '#ef4444',
  repost: '#22c55e',
  bookmark: '#f59e0b',
  verified: '#3b82f6',
  chatBubbleMine: '#3b82f6',
  chatBubbleOther: '#1a1a1a',
  divider: '#27272a',
  overlay: 'rgba(0,0,0,0.5)',

  // ── Aliases for backward compatibility ────────────────────────────────
  black: '#000000',
  white: '#ffffff',
  surfaceLight: '#1a1a1a',
  surfaceLighter: '#222222',
  surfaceBorder: '#2a2a2a',
  primaryDark: '#2563eb',
  card: '#141414',
  textPrimary: '#ffffff',
  textTertiary: '#6B7280',
  danger: '#ef4444',
  info: '#06b6d4',
  whiteAlpha80: 'rgba(255,255,255,0.8)',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha40: 'rgba(255,255,255,0.4)',
  whiteAlpha20: 'rgba(255,255,255,0.2)',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha05: 'rgba(255,255,255,0.05)',
  white80: 'rgba(255,255,255,0.8)',
  white60: 'rgba(255,255,255,0.6)',
  white40: 'rgba(255,255,255,0.4)',
  white20: 'rgba(255,255,255,0.2)',
  white10: 'rgba(255,255,255,0.1)',
  white05: 'rgba(255,255,255,0.05)',
  separator: 'rgba(255, 255, 255, 0.08)',
  messageMine: '#3b82f6',
  messageTheirs: '#1E1E1E',
  messageMineText: '#FFFFFF',
  messageTheirsText: '#E5E7EB',
  typingIndicator: '#6B7280',
  unreadBadge: '#3b82f6',
  unreadDot: '#3b82f6',
  verifiedBlue: '#3b82f6',
  verifiedGold: '#F59E0B',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.15)',
  primaryTransparent: 'rgba(59, 130, 246, 0.15)',
  dangerDark: '#dc2626',
  gold: '#fbbf24',
  badgeBlue: '#3b82f6',
  badgeGold: '#f59e0b',
  gradientStart: '#3b82f6',
  gradientEnd: '#8b5cf6',
  badgeNew: '#3b82f6',
  badgeContacted: '#f59e0b',
  badgeQualified: '#8b5cf6',
  badgeConverted: '#22c55e',
  badgeLost: '#ef4444',
};

// ─── Spacing scale ───────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ─── Font families ───────────────────────────────────────────────────────────
export const Fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'monospace',
};

// ─── Border radius scale ─────────────────────────────────────────────────────
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ─── Typography presets ───────────────────────────────────────────────────────
export const Typography = {
  titleLarge: { fontSize: 28, fontWeight: '700' as const },
  titleMedium: { fontSize: 22, fontWeight: '700' as const },
  titleSmall: { fontSize: 18, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, fontWeight: '400' as const },
  labelLarge: { fontSize: 14, fontWeight: '600' as const },
  labelMedium: { fontSize: 12, fontWeight: '500' as const },
  labelSmall: { fontSize: 11, fontWeight: '500' as const },
};

// ─── Font sizes ──────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 34,
};

// ─── Default theme export (backward compat) ─────────────────────────────────
export type ThemeColors = typeof Colors;

const theme = {
  Colors,
  Spacing,
  Fonts,
  FontSize,
  BorderRadius,
};

export default theme;

// ─── Reusable style presets ──────────────────────────────────────────────────
export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  surface: {
    backgroundColor: Colors.surface,
  },
  surfaceLight: {
    backgroundColor: Colors.surfaceElevated,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textPrimary: {
    color: Colors.text,
  },
  textSecondary: {
    color: Colors.textSecondary,
  },
  textTertiary: {
    color: Colors.textMuted,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonOutlineText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
