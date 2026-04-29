import { StyleSheet } from 'react-native';

// ─── Color tokens — Pixel-matched to web app "Pure Black Premium" theme ─────
// Web: --background #000000, --foreground #e7e9ea, --primary #FFFFFF
//      --secondary #16181c, --muted #16181c, --muted-foreground #71767b
//      --destructive #ef4444, --border #374151, --card #000000
export const Colors = {
  // Core
  background: '#000000',
  surface: '#16181c',       // --secondary, --muted
  surfaceElevated: '#1d1f23',
  surfaceHover: '#2a2d31',
  primary: '#FFFFFF',       // Web: --primary (WHITE, not blue!)
  primaryForeground: '#000000', // Text on white buttons
  secondary: '#16181c',     // --secondary
  text: '#e7e9ea',          // --foreground
  textSecondary: '#a1a1aa',
  textMuted: '#71767b',     // --muted-foreground
  border: '#374151',        // --border
  borderLight: '#3f3f46',
  card: '#000000',          // --card (same as bg)

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',         // --destructive
  like: '#ef4444',
  repost: '#22c55e',
  bookmark: '#f59e0b',

  // Verification badges (from web VerifiedBadge component)
  verified: '#3b82f6',
  verifiedGold: '#F59E0B',

  // Chat bubbles — matching web .bubble-sent / .bubble-received
  chatBubbleMine: '#FFFFFF',       // Web: white gradient for sent
  chatBubbleMineText: '#000000',   // Black text on white bubble
  chatBubbleOther: '#16181c',     // Web: glass/surface for received
  chatBubbleOtherText: '#e7e9ea',

  // Aliases for backward compat
  black: '#000000',
  white: '#ffffff',
  messageMine: '#FFFFFF',
  messageTheirs: '#1d1f23',
  messageMineText: '#000000',
  messageTheirsText: '#E5E7EB',
  divider: '#374151',
  overlay: 'rgba(0,0,0,0.5)',
  separator: 'rgba(255, 255, 255, 0.08)',

  surfaceLight: '#1d1f23',
  surfaceLighter: '#2a2d31',
  surfaceBorder: '#374151',
  primaryDark: '#e0e0e0',
  card: '#000000',
  textPrimary: '#e7e9ea',
  textTertiary: '#71767b',
  danger: '#ef4444',
  info: '#06b6d4',

  // Alpha scales (white on black)
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

  typingIndicator: '#71767b',
  unreadBadge: '#3b82f6',
  unreadDot: '#FFFFFF',
  verifiedBlue: '#3b82f6',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.15)',
  primaryTransparent: 'rgba(255, 255, 255, 0.1)',
  dangerDark: '#dc2626',
  gold: '#fbbf24',

  // Business/CRM badges
  badgeBlue: '#3b82f6',
  badgeGold: '#f59e0b',
  badgeNew: '#3b82f6',
  badgeContacted: '#f59e0b',
  badgeQualified: '#8b5cf6',
  badgeConverted: '#22c55e',
  badgeLost: '#ef4444',

  // Chart colors (from web)
  chart1: '#FFFFFF',
  chart2: '#2a7fff',
  chart3: '#f59e0b',
  chart4: '#ef4444',
  chart5: '#06b6d4',

  // Neon scale (from web)
  neon400: '#FFFFFF',
  neon500: '#D1D5DB',
  neon600: '#9CA3AF',

  // Gradient colors
  gradientStart: '#FFFFFF',
  gradientEnd: '#D1D5DB',
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
  bodyMedium: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  labelLarge: { fontSize: 14, fontWeight: '600' as const },
  labelMedium: { fontSize: 12, fontWeight: '500' as const },
  labelSmall: { fontSize: 11, fontWeight: '500' as const },
};

// ─── Font sizes ──────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 15,
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

// ─── Reusable style presets — matched to web app ────────────────────────────
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
    backgroundColor: Colors.background, // Web: card bg = #000000 same as page
    borderRadius: BorderRadius.md,
    borderWidth: 0, // Web: no visible card borders
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
  // Web primary button: white bg, black text, rounded
  buttonPrimary: {
    backgroundColor: Colors.primary, // WHITE
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: Colors.primaryForeground, // BLACK text on white button
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
    borderColor: Colors.border,
  },
  buttonOutlineText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface, // Web: input bg = secondary (#16181c)
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.lg,
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
