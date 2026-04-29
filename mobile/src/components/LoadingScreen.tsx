import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';

// ── Props ────────────────────────────────────────────────────────────────────

interface LoadingScreenProps {
  visible?: boolean;
  text?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

const LoadingScreen: React.FC<LoadingScreenProps> = ({ visible = true, text }) => {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      {text ? (
        <Text style={styles.text}>{text}</Text>
      ) : null}
    </View>
  );

  // If visible prop is used, render as a modal overlay
  if (!visible) {
    return <View style={styles.hidden}>{content}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>{content}</View>
    </Modal>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 4,
  },
});

export default LoadingScreen;
