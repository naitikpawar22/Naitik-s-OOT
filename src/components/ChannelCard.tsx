import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import { darkTheme, ThemePalette } from '../styles/theme';

interface ChannelCardProps {
  channel: Channel;
  isPlaying: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  activeTheme?: ThemePalette;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isPlaying,
  isFavorite,
  onSelect,
  onToggleFavorite,
  activeTheme = darkTheme,
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentLogoUri, setCurrentLogoUri] = useState<string | undefined>(channel.logo);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);

  const styles = getStyles(activeTheme);

  useEffect(() => {
    setCurrentLogoUri(channel.logo);
    setImageError(false);
    setFallbackAttempt(0);
  }, [channel.logo, channel.id]);

  const handleImageError = () => {
    if (fallbackAttempt === 0 && channel.tvgId) {
      setFallbackAttempt(1);
      setCurrentLogoUri(`https://raw.githubusercontent.com/iptv-org/iptv/master/logos/${channel.tvgId}.png`);
    } else if (fallbackAttempt === 1 && channel.tvgId) {
      setFallbackAttempt(2);
      const cleanId = channel.tvgId.split('.')[0];
      setCurrentLogoUri(`https://jiotvimages.cdn.jio.com/dare_images/images/${cleanId}.png`);
    } else {
      setImageError(true);
    }
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, ${activeTheme.mode === 'light' ? '40%' : '25%'})`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <TouchableOpacity
      style={[styles.card, isPlaying && styles.cardPlaying]}
      onPress={() => onSelect(channel)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.logoContainer}>
          {!imageError && currentLogoUri ? (
            <Image
              source={{ uri: currentLogoUri }}
              style={styles.logo}
              resizeMode="contain"
              onError={handleImageError}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(channel.name) }]}>
              <Text style={styles.avatarText}>{getInitials(channel.name)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.favButton}
          onPress={() => onToggleFavorite(channel.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? activeTheme.colors.secondary : activeTheme.colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {channel.name}
          </Text>
          {isPlaying && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {channel.category}
            </Text>
          </View>
          {channel.quality && (
            <Text style={styles.qualityTag} numberOfLines={1}>
              {channel.quality}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.cardBg,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm + 2,
      marginBottom: theme.spacing.sm + 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'column',
      justifyContent: 'space-between',
      ...Platform.select({
        web: {
          boxShadow: theme.mode === 'light' ? '0px 2px 8px rgba(0, 0, 0, 0.06)' : '0px 4px 6px rgba(0, 0, 0, 0.25)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 3,
        },
      }),
    },
    cardPlaying: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.mode === 'light' ? '#EEF2FF' : 'rgba(99, 102, 241, 0.12)',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    logoContainer: {
      width: 52,
      height: 52,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.mode === 'light' ? '#F8FAFC' : '#0F172A',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 2,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    avatar: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '700',
    },
    favButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    name: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginRight: 4,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.danger,
      marginRight: 4,
    },
    liveText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.danger,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryBadge: {
      backgroundColor: theme.colors.badgeBg,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    categoryText: {
      fontSize: 11,
      color: theme.colors.accent,
      fontWeight: '600',
    },
    qualityTag: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.success,
      backgroundColor: theme.mode === 'light' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });
