import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Settings: undefined;
  EditProfile: undefined;
  PrivacySettings: undefined;
  BusinessDashboard: undefined;
  MyStore: undefined;
  CrmDashboard: undefined;
  ChangePassword: undefined;
  Auth: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

interface SettingsItem {
  label: string;
  icon: string;
  iconColor?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  destructive?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [darkMode, setDarkMode] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);

  const handleSignOut = useCallback(async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await auth().signOut();
            // Clear keychain / secure storage would go here
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' as never }],
            });
          } catch (e) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  }, [navigation]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type DELETE to confirm. This feature will be available soon.',
            );
          },
        },
      ],
    );
  }, []);

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const sections: SettingsSection[] = React.useMemo(
    () => [
      {
        title: 'Account',
        items: [
          {
            label: 'Edit Profile',
            icon: 'account-edit',
            iconColor: Colors.primary,
            onPress: () => navigation.navigate('EditProfile'),
          },
          {
            label: 'Privacy Settings',
            icon: 'shield-lock',
            iconColor: Colors.success,
            onPress: () => navigation.navigate('PrivacySettings'),
          },
          {
            label: 'Change Password',
            icon: 'lock',
            iconColor: Colors.warning,
            onPress: () => navigation.navigate('ChangePassword' as never),
          },
        ],
      },
      {
        title: 'Preferences',
        items: [
          {
            label: 'Dark Mode',
            icon: 'weather-night',
            iconColor: '#8b5cf6',
            toggle: true,
            toggleValue: darkMode,
            onToggleChange: setDarkMode,
          },
          {
            label: 'Push Notifications',
            icon: 'bell',
            iconColor: Colors.primary,
            toggle: true,
            toggleValue: pushNotifications,
            onToggleChange: setPushNotifications,
          },
          {
            label: 'Language',
            icon: 'translate',
            iconColor: '#06b6d4',
            onPress: () => {},
          },
        ],
      },
      {
        title: 'Business',
        items: [
          {
            label: 'Business Dashboard',
            icon: 'chart-box',
            iconColor: Colors.primary,
            onPress: () => navigation.navigate('BusinessDashboard' as never),
          },
          {
            label: 'My Store',
            icon: 'store',
            iconColor: Colors.success,
            onPress: () => navigation.navigate('MyStore' as never),
          },
          {
            label: 'CRM',
            icon: 'account-group',
            iconColor: Colors.warning,
            onPress: () => navigation.navigate('CrmDashboard' as never),
          },
        ],
      },
      {
        title: 'Support',
        items: [
          {
            label: 'Help Center',
            icon: 'help-circle',
            iconColor: Colors.primary,
            onPress: () => openLink('https://black94.web.app/help'),
          },
          {
            label: 'Report Bug',
            icon: 'bug',
            iconColor: Colors.warning,
            onPress: () => openLink('https://black94.web.app/bug-report'),
          },
          {
            label: 'Terms of Service',
            icon: 'file-document',
            iconColor: Colors.textTertiary,
            onPress: () => openLink('https://black94.web.app/terms'),
          },
          {
            label: 'Privacy Policy',
            icon: 'shield-check',
            iconColor: Colors.textTertiary,
            onPress: () => openLink('https://black94.web.app/privacy-policy'),
          },
        ],
      },
    ],
    [navigation, darkMode, pushNotifications, openLink],
  );

  const renderIcon = (iconName: string, color?: string) => {
    const iconMap: Record<string, string> = {
      'account-edit': 'create-outline',
      'shield-lock': 'shield-lock-outline',
      'lock': 'key-outline',
      'weather-night': 'moon-outline',
      'bell': 'notifications-outline',
      'translate': 'globe-outline',
      'chart-box': 'stats-chart-outline',
      'store': 'storefront-outline',
      'account-group': 'people-outline',
      'help-circle': 'help-circle-outline',
      'bug': 'bug-outline',
      'file-document': 'document-text-outline',
      'shield-check': 'shield-checkmark-outline',
      'chevron-right': 'chevron-forward',
      'logout': 'log-out-outline',
      'delete': 'trash-outline',
    };
    return (
      <Icon
        name={iconMap[iconName] ?? 'ellipse-outline'}
        size={20}
        color={color ?? Colors.textSecondary}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.item,
                      index < section.items.length - 1 && styles.itemBorder,
                    ]}
                    onPress={item.onPress}
                    activeOpacity={item.toggle ? 1 : 0.7}
                    disabled={item.toggle}
                  >
                    <View style={styles.itemLeft}>
                      {renderIcon(item.icon, item.iconColor)}
                      <Text
                        style={[
                          styles.itemLabel,
                          item.destructive && styles.itemLabelDestructive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={item.toggleValue}
                        onValueChange={item.onToggleChange}
                        trackColor={{
                          false: Colors.surfaceBorder,
                          true: Colors.primary,
                        }}
                        thumbColor={Colors.white}
                      />
                    ) : (
                      <Text style={styles.chevron}>›</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={[styles.item]}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  {renderIcon('logout', Colors.danger)}
                  <Text style={[styles.itemLabel, styles.itemLabelDestructive]}>
                    Sign Out
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.itemBorder} />
              <TouchableOpacity
                style={[styles.item]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  {renderIcon('delete', Colors.danger)}
                  <Text style={[styles.itemLabel, styles.itemLabelDestructive]}>
                    Delete Account
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Black94 v1.0.0</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  itemLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  itemLabelDestructive: {
    color: Colors.danger,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});

export default SettingsScreen;
