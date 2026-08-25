import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService, UserProfile } from '../services/storageService';
import { IPTVService } from '../services/iptvService';
import { darkTheme, lightTheme, ThemePalette } from '../styles/theme';

interface SettingsScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  channelCount: number;
  onReloadChannels: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userProfile,
  onUpdateProfile,
  channelCount,
  onReloadChannels,
}) => {
  const [userName, setUserName] = useState(userProfile.userName);
  const [isSaved, setIsSaved] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const activeTheme: ThemePalette = userProfile.themeMode === 'light' ? lightTheme : darkTheme;
  const isLight = activeTheme.mode === 'light';

  const handleSaveName = async () => {
    const updated: UserProfile = {
      ...userProfile,
      userName: userName.trim() || 'Naitik Pawar',
    };
    await StorageService.saveUserProfile(updated);
    onUpdateProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    await StorageService.clearAllCache();
    IPTVService.clearCache();
    onReloadChannels();
    setIsClearing(false);

    if (Platform.OS === 'web') {
      alert('Cache cleared successfully! TV catalog re-indexed.');
    } else {
      Alert.alert('Cache Cleared', 'All stored cache and preferences cleared successfully.');
    }
  };

  const setThemeMode = async (mode: 'dark' | 'light') => {
    const updated: UserProfile = {
      ...userProfile,
      themeMode: mode,
    };
    await StorageService.saveUserProfile(updated);
    onUpdateProfile(updated);
  };

  const setQualityPref = async (quality: string) => {
    const updated: UserProfile = {
      ...userProfile,
      defaultQuality: quality,
    };
    await StorageService.saveUserProfile(updated);
    onUpdateProfile(updated);
  };

  const toggleFastMode = async () => {
    const updated: UserProfile = {
      ...userProfile,
      fastModeEnabled: !userProfile.fastModeEnabled,
    };
    await StorageService.saveUserProfile(updated);
    onUpdateProfile(updated);
  };

  const dynamicStyles = getStyles(activeTheme);

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.content}>
      <View style={dynamicStyles.header}>
        <Ionicons name="settings" size={28} color={activeTheme.colors.accentLight} />
        <Text style={dynamicStyles.title}>OTT Portal Settings</Text>
      </View>

      {/* Theme Selection Card with Slider Switch */}
      <View style={dynamicStyles.sectionCard}>
        <View style={dynamicStyles.sectionTitleRow}>
          <Ionicons
            name={isLight ? 'sunny' : 'moon'}
            size={22}
            color={isLight ? '#D97706' : activeTheme.colors.accentLight}
          />
          <Text style={dynamicStyles.sectionTitle}>App Display Theme</Text>
        </View>

        <View style={dynamicStyles.themeSliderRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={dynamicStyles.themeTitle}>
              {isLight ? '☀️ Bright / Light Theme' : '🌙 Dark / Midnight Theme'}
            </Text>
            <Text style={dynamicStyles.descriptionText}>
              {isLight
                ? 'Active: Crisp Daylight White (High Contrast)'
                : 'Active: Sleek OTT Midnight Dark Mode'}
            </Text>
          </View>

          {/* Theme Slider Toggle Bar */}
          <TouchableOpacity
            style={[
              dynamicStyles.themeSliderTrack,
              isLight && dynamicStyles.themeSliderTrackLight,
            ]}
            onPress={() => setThemeMode(isLight ? 'dark' : 'light')}
            activeOpacity={0.8}
          >
            <View style={dynamicStyles.sliderIconsRow}>
              <Ionicons name="moon" size={13} color={!isLight ? '#FFF' : '#94A3B8'} />
              <Ionicons name="sunny" size={13} color={isLight ? '#FFF' : '#94A3B8'} />
            </View>
            <View
              style={[
                dynamicStyles.themeSliderKnob,
                isLight ? dynamicStyles.themeSliderKnobRight : dynamicStyles.themeSliderKnobLeft,
              ]}
            >
              <Ionicons
                name={isLight ? 'sunny' : 'moon'}
                size={14}
                color={isLight ? '#D97706' : '#6366F1'}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Profile Section */}
      <View style={dynamicStyles.sectionCard}>
        <View style={dynamicStyles.sectionTitleRow}>
          <Ionicons name="person-circle-outline" size={22} color={activeTheme.colors.accentLight} />
          <Text style={dynamicStyles.sectionTitle}>User Profile</Text>
        </View>

        <Text style={dynamicStyles.fieldLabel}>Profile / Account Name:</Text>
        <View style={dynamicStyles.inputRow}>
          <TextInput
            style={dynamicStyles.textInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter your name..."
            placeholderTextColor={activeTheme.colors.textMuted}
          />
          <TouchableOpacity style={dynamicStyles.saveBtn} onPress={handleSaveName}>
            <Text style={dynamicStyles.saveBtnText}>{isSaved ? 'Saved! ✓' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Default Quality Settings */}
      <View style={dynamicStyles.sectionCard}>
        <View style={dynamicStyles.sectionTitleRow}>
          <Ionicons name="options-outline" size={22} color={activeTheme.colors.accentLight} />
          <Text style={dynamicStyles.sectionTitle}>Default Stream Quality</Text>
        </View>

        <Text style={dynamicStyles.descriptionText}>
          Preferred default resolution for live TV playback:
        </Text>

        <View style={dynamicStyles.qualityOptionsRow}>
          {['Auto', '1080p', '720p', '480p', '360p'].map((q) => {
            const isSelected = userProfile.defaultQuality === q;
            return (
              <TouchableOpacity
                key={q}
                style={[dynamicStyles.qualityChip, isSelected && dynamicStyles.qualityChipSelected]}
                onPress={() => setQualityPref(q)}
              >
                <Text style={[dynamicStyles.qualityChipText, isSelected && dynamicStyles.qualityChipTextSelected]}>
                  {q}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Network & Fast Stream Optimization */}
      <View style={dynamicStyles.sectionCard}>
        <View style={dynamicStyles.sectionTitleRow}>
          <Ionicons name="flash-outline" size={22} color="#F59E0B" />
          <Text style={dynamicStyles.sectionTitle}>Low-Internet Speed Engine</Text>
        </View>

        <View style={dynamicStyles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.toggleTitle}>Fast Stream Low-Data Mode</Text>
            <Text style={dynamicStyles.descriptionText}>
              Reduces buffer latency to start live broadcasts instantly on slow Wi-Fi or mobile data.
            </Text>
          </View>
          <TouchableOpacity
            style={[dynamicStyles.toggleSwitch, userProfile.fastModeEnabled && dynamicStyles.toggleSwitchOn]}
            onPress={toggleFastMode}
          >
            <View
              style={[dynamicStyles.toggleKnob, userProfile.fastModeEnabled && dynamicStyles.toggleKnobOn]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Cache & Storage */}
      <View style={dynamicStyles.sectionCard}>
        <View style={dynamicStyles.sectionTitleRow}>
          <Ionicons name="trash-bin-outline" size={22} color={activeTheme.colors.danger} />
          <Text style={dynamicStyles.sectionTitle}>Cache & Storage</Text>
        </View>

        <View style={dynamicStyles.statRow}>
          <Text style={dynamicStyles.statLabel}>Indexed Live TV Channels:</Text>
          <Text style={dynamicStyles.statValue}>{channelCount} Channels</Text>
        </View>

        <TouchableOpacity
          style={dynamicStyles.clearCacheBtn}
          onPress={handleClearCache}
          disabled={isClearing}
        >
          <Ionicons name="reload-outline" size={18} color={activeTheme.colors.danger} style={{ marginRight: 6 }} />
          <Text style={dynamicStyles.clearCacheBtnText}>
            {isClearing ? 'Clearing Cache...' : 'Clear Storage Cache & Re-index'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Version Info */}
      <View style={dynamicStyles.footerInfo}>
        <Text style={dynamicStyles.footerAppTitle}>StreamPulse TV Indian Portal v1.2.0</Text>
        <Text style={dynamicStyles.footerAppSub}>Optimized for Mobile & Android TV Broadcast</Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginLeft: 10,
    },
    sectionCard: {
      backgroundColor: theme.colors.cardBg,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginLeft: 8,
    },
    themeSliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    themeTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    themeSliderTrack: {
      width: 66,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#1E293B',
      borderWidth: 1,
      borderColor: '#334155',
      padding: 3,
      position: 'relative',
      justifyContent: 'center',
    },
    themeSliderTrackLight: {
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
    },
    sliderIconsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    themeSliderKnob: {
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 4,
        },
      }),
    },
    themeSliderKnobLeft: {
      left: 4,
    },
    themeSliderKnobRight: {
      left: 34,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: theme.colors.textPrimary,
      fontSize: 14,
      marginRight: 8,
    },
    saveBtn: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    saveBtnText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 13,
    },
    descriptionText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 6,
    },
    qualityOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    qualityChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
      marginBottom: 8,
    },
    qualityChipSelected: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentLight,
    },
    qualityChipText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    qualityChipTextSelected: {
      color: '#FFF',
      fontWeight: '700',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    toggleTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    toggleSwitch: {
      width: 48,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.border,
      padding: 2,
    },
    toggleSwitchOn: {
      backgroundColor: '#F59E0B',
    },
    toggleKnob: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFF',
    },
    toggleKnobOn: {
      transform: [{ translateX: 22 }],
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    statValue: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.accentLight,
    },
    clearCacheBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.mode === 'light' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: theme.colors.danger,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    clearCacheBtnText: {
      color: theme.colors.danger,
      fontWeight: '700',
      fontSize: 13,
    },
    footerInfo: {
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    footerAppTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    footerAppSub: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
  });
