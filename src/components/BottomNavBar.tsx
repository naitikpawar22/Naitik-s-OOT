import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme, ThemePalette } from '../styles/theme';

export type TabType = 'home' | 'movies' | 'favorites' | 'settings';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  favoritesCount: number;
  activeTheme?: ThemePalette;
}

export const BottomNavBarComponent: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  favoritesCount,
  activeTheme = darkTheme,
}) => {
  const styles = useMemo(() => getStyles(activeTheme), [activeTheme]);

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'home' && styles.tabBtnActive]}
        onPress={() => onTabChange('home')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'home' ? activeTheme.colors.accentLight : activeTheme.colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Movies Tab */}
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'movies' && styles.tabBtnActive]}
        onPress={() => onTabChange('movies')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons
          name={activeTab === 'movies' ? 'film' : 'film-outline'}
          size={22}
          color={activeTab === 'movies' ? activeTheme.colors.accentLight : activeTheme.colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'movies' && styles.tabLabelActive]}>
          Movies 🍿
        </Text>
      </TouchableOpacity>

      {/* Favorites Tab */}
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'favorites' && styles.tabBtnActive]}
        onPress={() => onTabChange('favorites')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <View style={styles.iconBadgeWrapper}>
          <Ionicons
            name={activeTab === 'favorites' ? 'heart' : 'heart-outline'}
            size={22}
            color={activeTab === 'favorites' ? activeTheme.colors.secondary : activeTheme.colors.textMuted}
          />
          {favoritesCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{favoritesCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, activeTab === 'favorites' && styles.tabLabelActive]}>
          Favorites
        </Text>
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
        onPress={() => onTabChange('settings')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons
          name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
          size={22}
          color={activeTab === 'settings' ? activeTheme.colors.accentLight : activeTheme.colors.textMuted}
        />
        <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const BottomNavBar = React.memo(BottomNavBarComponent);

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: 62,
      backgroundColor: theme.colors.cardBg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-around',
      ...Platform.select({
        web: {
          boxShadow: theme.mode === 'light' ? '0px -2px 10px rgba(0, 0, 0, 0.08)' : '0px -4px 12px rgba(0, 0, 0, 0.4)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        },
      }),
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    tabBtnActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.accentLight,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 3,
    },
    tabLabelActive: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    iconBadgeWrapper: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -10,
      backgroundColor: theme.colors.secondary,
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '800',
    },
  });

