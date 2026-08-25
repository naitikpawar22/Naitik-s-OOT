import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import { ThemePalette } from '../styles/theme';

interface SpotlightBannerProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeTheme: ThemePalette;
}

export const SpotlightBanner: React.FC<SpotlightBannerProps> = ({
  channels,
  onSelectChannel,
  activeTheme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

  // Filter top featured channels (e.g. Marathi, Hindi, News, Kids)
  const spotlightList = channels.slice(0, 5);

  useEffect(() => {
    if (spotlightList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % spotlightList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [spotlightList.length]);

  if (spotlightList.length === 0) return null;

  const currentChannel = spotlightList[currentIndex] || spotlightList[0];

  const styles = getStyles(activeTheme, isSmallScreen);

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerBackground}>
        {/* Channel Backdrop Image or Fallback */}
        <Image
          source={{ uri: currentChannel.logo }}
          style={styles.backgroundImage}
          blurRadius={Platform.OS === 'web' ? 25 : 10}
        />
        <View style={styles.bannerOverlay} />
      </View>

      <View style={styles.bannerContent}>
        {/* Top Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.featuredBadge}>
            <Ionicons name="sparkles" size={10} color="#FFF" style={{ marginRight: 3 }} />
            <Text style={styles.featuredBadgeText}>SPOTLIGHT BROADCAST</Text>
          </View>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>{currentChannel.quality || '1080p Full HD'}</Text>
          </View>
        </View>

        {/* Channel Info */}
        <View style={styles.channelHeaderRow}>
          {currentChannel.logo ? (
            <Image source={{ uri: currentChannel.logo }} style={styles.channelLogo} resizeMode="contain" />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>
                {currentChannel.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.textDetails}>
            <Text style={styles.channelName} numberOfLines={1}>
              {currentChannel.name}
            </Text>
            <Text style={styles.channelSub} numberOfLines={1}>
              Live Stream • {currentChannel.category || 'General'} Broadcast
            </Text>
          </View>
        </View>

        {/* Action Button & Carousel Dots */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => onSelectChannel(currentChannel)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.playBtnText}>Watch Now Live</Text>
          </TouchableOpacity>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {spotlightList.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.dot, idx === currentIndex && styles.activeDot]}
                onPress={() => setCurrentIndex(idx)}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme: ThemePalette, isSmallScreen: boolean) =>
  StyleSheet.create({
    bannerContainer: {
      marginHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      position: 'relative',
      height: isSmallScreen ? 150 : 160,
      borderWidth: 1,
      borderColor: theme.mode === 'light' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.12)',
      ...Platform.select({
        web: {
          boxShadow: '0px 6px 20px rgba(79, 70, 229, 0.25)',
        },
        default: {
          shadowColor: theme.colors.accent,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 6,
        },
      }),
    },
    bannerBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0F172A',
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
      opacity: 0.35,
    },
    bannerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.mode === 'light'
        ? 'rgba(255, 255, 255, 0.75)'
        : 'rgba(15, 23, 42, 0.75)',
    },
    bannerContent: {
      flex: 1,
      padding: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      justifyContent: 'space-between',
      zIndex: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featuredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#6366F1',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      marginRight: 6,
    },
    featuredBadgeText: {
      color: '#FFF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    qualityBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderWidth: 1,
      borderColor: '#10B981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    qualityBadgeText: {
      color: '#10B981',
      fontSize: 9,
      fontWeight: '800',
    },
    channelHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    channelLogo: {
      width: isSmallScreen ? 36 : 44,
      height: isSmallScreen ? 36 : 44,
      borderRadius: 8,
      backgroundColor: '#FFF',
      marginRight: 10,
    },
    logoFallback: {
      width: isSmallScreen ? 36 : 44,
      height: isSmallScreen ? 36 : 44,
      borderRadius: 8,
      backgroundColor: theme.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    logoFallbackText: {
      color: '#FFF',
      fontWeight: '900',
      fontSize: 14,
    },
    textDetails: {
      flex: 1,
    },
    channelName: {
      fontSize: isSmallScreen ? 15 : 18,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    channelSub: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    playBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      ...Platform.select({
        web: {
          boxShadow: '0px 3px 10px rgba(99, 102, 241, 0.4)',
        },
        default: {
          elevation: 4,
        },
      }),
    },
    playBtnText: {
      color: '#FFF',
      fontSize: isSmallScreen ? 11 : 13,
      fontWeight: '800',
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.colors.textMuted,
      marginHorizontal: 2,
      opacity: 0.5,
    },
    activeDot: {
      width: 14,
      backgroundColor: theme.colors.accentLight,
      opacity: 1,
    },
  });
