import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ReactNode,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// ── Props ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

// ── Component ────────────────────────────────────────────────────────────────

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  rightAction,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Left: Back button or spacer */}
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* Center: Title */}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right: Action or spacer */}
      <View style={styles.right}>{rightAction ?? <View style={styles.spacer} />}</View>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#000000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 44,
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  backIcon: {
    fontSize: 28,
    color: '#e7e9ea',
    fontWeight: '300',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e7e9ea',
  },
});

export default Header;
