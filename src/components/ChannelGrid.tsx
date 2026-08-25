import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import { ChannelCard } from './ChannelCard';
import { darkTheme, ThemePalette } from '../styles/theme';

interface ChannelGridProps {
  channels: Channel[];
  playingChannelId: string | null;
  favorites: string[];
  isLoading: boolean;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onRefresh?: () => void;
  activeTheme?: ThemePalette;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels,
  playingChannelId,
  favorites,
  isLoading,
  onSelectChannel,
  onToggleFavorite,
  onRefresh,
  activeTheme = darkTheme,
}) => {
  const { width } = useWindowDimensions();
  const styles = getStyles(activeTheme);

  const numColumns =
    width >= 1280 ? 6 :
    width >= 1024 ? 5 :
    width >= 768 ? 4 :
    width >= 520 ? 3 : 2;

  if (isLoading && channels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={activeTheme.colors.accentLight} />
        <Text style={styles.loadingText}>Fetching Live TV Channels...</Text>
      </View>
    );
  }

  if (channels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search-outline" size={48} color={activeTheme.colors.textMuted} />
        <Text style={styles.emptyTitle}>No Channels Found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your search query, category, or language filter.</Text>
      </View>
    );
  }

  return (
    <FlatList
      key={`grid-${numColumns}`}
      data={channels}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.listPadding}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={activeTheme.colors.accentLight}
            colors={[activeTheme.colors.accentLight]}
          />
        ) : undefined
      }
      renderItem={({ item }) => (
        <View style={numColumns > 1 ? { flex: 1, marginHorizontal: 4 } : undefined}>
          <ChannelCard
            channel={item}
            isPlaying={playingChannelId === item.id}
            isFavorite={favorites.includes(item.id)}
            onSelect={onSelectChannel}
            onToggleFavorite={onToggleFavorite}
            activeTheme={activeTheme}
          />
        </View>
      )}
    />
  );
};

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    listPadding: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xl * 2,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      minHeight: 300,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 12,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
