import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import { ThemePalette } from '../styles/theme';

interface MoviesScreenProps {
  movieChannels: Channel[];
  onSelectMovie: (channel: Channel) => void;
  activeTheme: ThemePalette;
}

export const MoviesScreen: React.FC<MoviesScreenProps> = ({
  movieChannels,
  onSelectMovie,
  activeTheme,
}) => {
  const [movieTab, setMovieTab] = useState<'live' | 'new'>('live');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

  const styles = getStyles(activeTheme, isSmallScreen);

  // Filter movies by genre selection
  const genres = [
    { id: 'all', name: 'All Movies 🍿', icon: 'film' },
    { id: 'marathi', name: 'Marathi Cinema 🚩', icon: 'flag' },
    { id: 'hindi', name: 'Hindi Cinema 🇮🇳', icon: 'videocam' },
    { id: 'action', name: 'Action & Thriller 💥', icon: 'flash' },
    { id: 'comedy', name: 'Comedy & Drama 😂', icon: 'happy' },
  ];

  const filteredMovies = movieChannels.filter((ch) => {
    const nameLower = ch.name.toLowerCase();
    const catLower = ch.category.toLowerCase();

    if (selectedGenre === 'marathi') {
      return ch.language === 'mr' || nameLower.includes('marathi');
    }
    if (selectedGenre === 'hindi') {
      return ch.language === 'hi' || nameLower.includes('hindi') || nameLower.includes('bollywood');
    }
    if (selectedGenre === 'action') {
      return nameLower.includes('action') || nameLower.includes('goldmines') || catLower.includes('action');
    }
    if (selectedGenre === 'comedy') {
      return nameLower.includes('comedy') || nameLower.includes('drama') || catLower.includes('comedy');
    }
    return true;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header Mode Selector: Live Movies vs New Movies */}
      <View style={styles.topTabWrapper}>
        <TouchableOpacity
          style={[styles.topTabBtn, movieTab === 'live' && styles.topTabBtnActive]}
          onPress={() => setMovieTab('live')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="radio"
            size={16}
            color={movieTab === 'live' ? '#FFF' : activeTheme.colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.topTabText, movieTab === 'live' && styles.topTabTextActive]}>
            🔴 Live Movies
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, movieTab === 'new' && styles.topTabBtnActive]}
          onPress={() => setMovieTab('new')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={movieTab === 'new' ? '#FFF' : activeTheme.colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.topTabText, movieTab === 'new' && styles.topTabTextActive]}>
            🆕 New Movies
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Movies Section View */}
      {movieTab === 'live' && (
        <>
          {/* Header Banner */}
          <View style={styles.headerHero}>
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.popBadge}>
                <Ionicons name="flame" size={12} color="#FF9900" style={{ marginRight: 4 }} />
                <Text style={styles.popBadgeText}>LIVE MOVIES PORTAL</Text>
              </View>
              <Text style={styles.heroTitle}>Unlimited Live Cinema & Movies</Text>
              <Text style={styles.heroSub}>
                Stream top Marathi Cinema, Hindi Blockbusters, Action & Entertainment live channels.
              </Text>
            </View>
          </View>

          {/* Genre Pills Row */}
          <View style={styles.genreSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
              {genres.map((genre) => {
                const isActive = selectedGenre === genre.id;
                return (
                  <TouchableOpacity
                    key={genre.id}
                    style={[styles.genreChip, isActive && styles.genreChipActive]}
                    onPress={() => setSelectedGenre(genre.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={genre.icon as any}
                      size={14}
                      color={isActive ? '#FFF' : activeTheme.colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.genreText, isActive && styles.genreTextActive]}>
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Movies Grid */}
          <View style={styles.moviesGridContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedGenre === 'all' ? 'All Live Movie Channels' : genres.find((g) => g.id === selectedGenre)?.name}
              </Text>
              <Text style={styles.movieCountBadge}>{filteredMovies.length} Channels</Text>
            </View>

            {filteredMovies.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="film-outline" size={44} color={activeTheme.colors.textMuted} />
                <Text style={styles.emptyText}>No channels found for this movie category.</Text>
              </View>
            ) : (
              <View style={styles.gridRow}>
                {filteredMovies.map((movie) => (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.movieCard}
                    onPress={() => onSelectMovie(movie)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.posterWrapper}>
                      {movie.logo ? (
                        <Image source={{ uri: movie.logo }} style={styles.posterImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.posterFallback}>
                          <Ionicons name="film" size={24} color="#FFF" />
                        </View>
                      )}
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTagText}>● LIVE</Text>
                      </View>
                      <View style={styles.qualityBadge}>
                        <Text style={styles.qualityText}>{movie.quality || '1080p'}</Text>
                      </View>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.movieTitle} numberOfLines={1}>
                        {movie.name}
                      </Text>
                      <Text style={styles.movieSub} numberOfLines={1}>
                        {movie.category} • {movie.language === 'mr' ? 'Marathi 🚩' : movie.language === 'hi' ? 'Hindi 🇮🇳' : 'Global'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* New Movies Section View (Ready for User Instructions) */}
      {movieTab === 'new' && (
        <View style={styles.newMoviesContainer}>
          <View style={styles.newMoviesHero}>
            <Ionicons name="sparkles" size={48} color={activeTheme.colors.accentLight} />
            <Text style={styles.newMoviesTitle}>🆕 New Movies Portal</Text>
            <Text style={styles.newMoviesSub}>
              This section is ready! Please provide your instructions for the New Movies layout, categories, or releases.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const getStyles = (theme: ThemePalette, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    topTabWrapper: {
      flexDirection: 'row',
      marginHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.cardBg,
      borderRadius: theme.borderRadius.md,
      padding: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    topTabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: theme.borderRadius.sm,
    },
    topTabBtnActive: {
      backgroundColor: theme.colors.accent,
    },
    topTabText: {
      fontSize: isSmallScreen ? 12 : 13,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    topTabTextActive: {
      color: '#FFF',
      fontWeight: '800',
    },
    headerHero: {
      height: isSmallScreen ? 130 : 150,
      marginHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      marginTop: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: '#1E1B4B',
      overflow: 'hidden',
      position: 'relative',
      justifyContent: 'center',
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    heroContent: {
      zIndex: 2,
    },
    popBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 153, 0, 0.2)',
      borderWidth: 1,
      borderColor: '#FF9900',
      alignSelf: 'flex-start',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      marginBottom: 6,
    },
    popBadgeText: {
      color: '#FF9900',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontSize: isSmallScreen ? 17 : 20,
      fontWeight: '900',
      color: '#FFF',
    },
    heroSub: {
      fontSize: isSmallScreen ? 11 : 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 3,
      maxWidth: '95%',
    },
    genreSection: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    genreScroll: {
      paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    },
    genreChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.cardBg,
      paddingHorizontal: isSmallScreen ? 10 : 14,
      paddingVertical: isSmallScreen ? 6 : 8,
      borderRadius: theme.borderRadius.full,
      marginRight: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    genreChipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentLight,
    },
    genreText: {
      fontSize: isSmallScreen ? 11 : 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    genreTextActive: {
      color: '#FFF',
    },
    moviesGridContainer: {
      paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      paddingBottom: 80,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: theme.spacing.xs,
    },
    sectionTitle: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    movieCountBadge: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.accentLight,
      backgroundColor: theme.colors.cardBg,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    emptyText: {
      marginTop: 8,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    gridRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    movieCard: {
      width: isSmallScreen ? '48.5%' : '31.5%',
      backgroundColor: theme.colors.cardBg,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    posterWrapper: {
      height: isSmallScreen ? 105 : 120,
      width: '100%',
      backgroundColor: '#0F172A',
      position: 'relative',
    },
    posterImage: {
      width: '100%',
      height: '100%',
    },
    posterFallback: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
    },
    liveTag: {
      position: 'absolute',
      top: 4,
      left: 4,
      backgroundColor: '#EF4444',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    liveTagText: {
      color: '#FFF',
      fontSize: 8.5,
      fontWeight: '900',
    },
    qualityBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    qualityText: {
      color: '#10B981',
      fontSize: 8.5,
      fontWeight: '800',
    },
    cardInfo: {
      padding: theme.spacing.xs,
    },
    movieTitle: {
      fontSize: isSmallScreen ? 11.5 : 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    movieSub: {
      fontSize: 10,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    newMoviesContainer: {
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.xl,
      alignItems: 'center',
    },
    newMoviesHero: {
      backgroundColor: theme.colors.cardBg,
      borderRadius: theme.borderRadius.lg,
      padding: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    newMoviesTitle: {
      fontSize: isSmallScreen ? 18 : 20,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      marginTop: 10,
    },
    newMoviesSub: {
      fontSize: isSmallScreen ? 12 : 13,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 17,
    },
  });
