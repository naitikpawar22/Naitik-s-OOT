import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme, ThemePalette } from '../styles/theme';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  channelCount: number;
  isFilterOpen: boolean;
  onToggleFilterDrawer: () => void;
  activeFilterCount?: number;
  searchInputRef?: React.RefObject<TextInput | null>;
  activeTheme?: ThemePalette;
}

export const HeaderComponent: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  channelCount,
  isFilterOpen,
  onToggleFilterDrawer,
  activeFilterCount = 0,
  searchInputRef,
  activeTheme = darkTheme,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;
  const styles = useMemo(() => getStyles(activeTheme), [activeTheme]);

  return (
    <View style={styles.container}>
      <View style={styles.singleHeaderRow}>
        {/* Left Logo Image & App Title */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/favicon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {!isSmallScreen && (
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                StreamPulse<Text style={styles.brandAccent}>TV</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Center Search Input Field */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={activeTheme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef as any}
            style={styles.searchInput}
            placeholder={isSmallScreen ? "Search ('9')..." : "Search channels (Press '9')..."}
            placeholderTextColor={activeTheme.colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              style={styles.clearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={16} color={activeTheme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Filter Toggle Button */}
        <TouchableOpacity
          style={[styles.filterToggleBtn, isFilterOpen && styles.filterToggleBtnActive]}
          onPress={onToggleFilterDrawer}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={isFilterOpen ? activeTheme.colors.accentLight : activeTheme.colors.textPrimary}
          />
          {!isSmallScreen && (
            <Text
              style={[
                styles.filterToggleText,
                isFilterOpen && styles.filterToggleTextActive,
              ]}
            >
              Filters
            </Text>
          )}
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const Header = React.memo(HeaderComponent);

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.cardBg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    singleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 6,
    },
    logoImage: {
      width: 42,
      height: 42,
      borderRadius: 8,
    },
    brandTextContainer: {
      marginLeft: 8,
    },
    brandTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    brandAccent: {
      color: theme.colors.accentLight,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 38,
      marginHorizontal: 6,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 13,
      height: '100%',
    },
    clearBtn: {
      padding: 2,
    },
    filterToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.mode === 'light' ? '#EEF2FF' : 'rgba(99, 102, 241, 0.12)',
      borderWidth: 1,
      borderColor: theme.colors.borderActive,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 10,
      height: 38,
      position: 'relative',
    },
    filterToggleBtnActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentLight,
    },
    filterToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginLeft: 6,
    },
    filterToggleTextActive: {
      color: '#FFF',
    },
    filterBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadgeText: {
      color: '#FFF',
      fontSize: 9,
      fontWeight: '900',
    },
  });

