import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel, Movie } from '../types';
import { ThemePalette } from '../styles/theme';
import { MovieService } from '../services/movieService';

interface MoviesScreenProps {
  movieChannels: Channel[];
  onSelectMovie: (channel: Channel) => void;
  activeTheme: ThemePalette;
}

export const MoviesScreenComponent: React.FC<MoviesScreenProps> = ({
  movieChannels,
  onSelectMovie,
  activeTheme,
}) => {
  const [movieTab, setMovieTab] = useState<'live' | 'new'>('live');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [newMovies, setNewMovies] = useState<Movie[]>([]);
  const [isLoadingNewMovies, setIsLoadingNewMovies] = useState<boolean>(false);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<Movie | null>(null);

  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

  const styles = useMemo(() => getStyles(activeTheme, isSmallScreen), [activeTheme, isSmallScreen]);

  // Lazy load dedicated New Movies API ONLY when user selects 'new' tab or mounts MoviesScreen
  useEffect(() => {
    if (movieTab === 'new' && newMovies.length === 0) {
      fetchNewMovies();
    }
  }, [movieTab]);

  const fetchNewMovies = async () => {
    setIsLoadingNewMovies(true);
    try {
      const data = await MovieService.getNewMovies();
      setNewMovies(data);
    } catch (e) {
      console.warn('Failed to load new movies:', e);
    } finally {
      setIsLoadingNewMovies(false);
    }
  };

  // Convert a Movie object to Channel object for seamless full-screen TVPlayer playback
  const handlePlayMovie = useCallback(
    (movie: Movie) => {
      setSelectedMovieDetail(null);
      const movieChannel: Channel = {
        id: movie.id,
        name: movie.title,
        category: movie.genres.join(', ') || 'Movie',
        logo: movie.posterUrl,
        url: movie.streamUrl,
        quality: movie.quality || '4K Ultra HD',
        language: movie.language,
      };
      onSelectMovie(movieChannel);
    },
    [onSelectMovie]
  );

  const genres = useMemo(
    () => [
      { id: 'all', name: 'All Movies 🍿', icon: 'film' },
      { id: 'marathi', name: 'Marathi Cinema 🚩', icon: 'flag' },
      { id: 'hindi', name: 'Hindi Cinema 🇮🇳', icon: 'videocam' },
      { id: 'action', name: 'Action & Thriller 💥', icon: 'flash' },
      { id: 'comedy', name: 'Comedy & Horror 😂', icon: 'happy' },
    ],
    []
  );

  // Filter Live Movies (IPTV API)
  const filteredLiveMovies = useMemo(() => {
    return movieChannels.filter((ch) => {
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
  }, [movieChannels, selectedGenre]);

  // Filter New VOD Movies (Movie API)
  const filteredNewMovies = useMemo(() => {
    return newMovies.filter((mv) => {
      if (selectedGenre === 'marathi') return mv.language === 'mr' || mv.genres.includes('Marathi');
      if (selectedGenre === 'hindi') return mv.language === 'hi' || mv.genres.includes('Hindi');
      if (selectedGenre === 'action') return mv.genres.includes('Action') || mv.genres.includes('Sci-Fi');
      if (selectedGenre === 'comedy') return mv.genres.includes('Comedy') || mv.genres.includes('Drama');
      return true;
    });
  }, [newMovies, selectedGenre]);

  const featuredMovie = useMemo(() => {
    return newMovies.find((m) => m.isTrending) || newMovies[0] || null;
  }, [newMovies]);

  const numColumns = isSmallScreen ? 2 : 3;

  const keyExtractor = useCallback((item: Channel) => item.id, []);
  const movieKeyExtractor = useCallback((item: Movie) => item.id, []);

  // Live IPTV Movie Card Renderer
  const renderLiveMovieCard = useCallback(
    ({ item: movie }: { item: Channel }) => (
      <TouchableOpacity
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
    ),
    [onSelectMovie, styles]
  );

  // New VOD Movie Card Renderer
  const renderNewMovieCard = useCallback(
    ({ item: movie }: { item: Movie }) => (
      <TouchableOpacity
        style={styles.vodMovieCard}
        onPress={() => setSelectedMovieDetail(movie)}
        activeOpacity={0.8}
      >
        <View style={styles.vodPosterWrapper}>
          <Image source={{ uri: movie.posterUrl }} style={styles.posterImage} resizeMode="cover" />
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FBBF24" style={{ marginRight: 2 }} />
            <Text style={styles.ratingBadgeText}>{movie.rating}</Text>
          </View>
          <View style={styles.vodQualityBadge}>
            <Text style={styles.vodQualityText}>{movie.quality || '4K'}</Text>
          </View>
          {movie.isNewRelease && (
            <View style={styles.newReleaseTag}>
              <Text style={styles.newReleaseText}>NEW</Text>
            </View>
          )}
        </View>

        <View style={styles.vodCardInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {movie.title}
          </Text>
          <Text style={styles.movieSub} numberOfLines={1}>
            {movie.releaseYear} • {movie.genres.join(', ')}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [styles]
  );

  const TopHeaderSection = useMemo(
    () => (
      <View>
        {/* Top Header Selector: 🔴 Live Cinema (IPTV API) vs 🆕 New Releases (Movies API) */}
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
              🔴 Live Movies (IPTV)
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
              🆕 New Movies Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Genre Filters Scroll Row */}
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

        {/* Hero Spotlight Banner for New Movies Mode */}
        {movieTab === 'new' && featuredMovie && (
          <View style={styles.featuredHero}>
            <Image source={{ uri: featuredMovie.bannerUrl || featuredMovie.posterUrl }} style={styles.heroBgImage} />
            <View style={styles.heroGradientOverlay} />
            <View style={styles.heroDetails}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroPopBadge}>
                  <Ionicons name="flame" size={12} color="#FF9900" style={{ marginRight: 4 }} />
                  <Text style={styles.heroPopBadgeText}>FEATURED BLOCKBUSTER</Text>
                </View>
                <View style={styles.heroRatingBadge}>
                  <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 3 }} />
                  <Text style={styles.heroRatingText}>{featuredMovie.rating} / 10</Text>
                </View>
              </View>

              <Text style={styles.heroTitleText} numberOfLines={1}>
                {featuredMovie.title}
              </Text>

              <Text style={styles.heroMetaText}>
                {featuredMovie.releaseYear} • {featuredMovie.duration} • {featuredMovie.quality} • {featuredMovie.genres.join(', ')}
              </Text>

              <Text style={styles.heroOverviewText} numberOfLines={2}>
                {featuredMovie.overview}
              </Text>

              <TouchableOpacity
                style={styles.heroPlayBtn}
                onPress={() => handlePlayMovie(featuredMovie)}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.heroPlayBtnText}>Watch Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionHeaderPadding}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {movieTab === 'live'
                ? selectedGenre === 'all'
                  ? 'All Live Movie Channels'
                  : genres.find((g) => g.id === selectedGenre)?.name
                : 'Latest Released Movies'}
            </Text>
            <Text style={styles.movieCountBadge}>
              {movieTab === 'live' ? filteredLiveMovies.length : filteredNewMovies.length} Titles
            </Text>
          </View>
        </View>
      </View>
    ),
    [
      movieTab,
      selectedGenre,
      genres,
      featuredMovie,
      filteredLiveMovies.length,
      filteredNewMovies.length,
      styles,
      activeTheme,
      handlePlayMovie,
    ]
  );

  return (
    <View style={styles.container}>
      {/* 🔴 Live Movies Mode (IPTV API) */}
      {movieTab === 'live' && (
        <FlatList
          key={`live-movies-${numColumns}`}
          data={filteredLiveMovies}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          ListHeaderComponent={TopHeaderSection}
          renderItem={renderLiveMovieCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
          columnWrapperStyle={styles.columnWrapper}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="film-outline" size={44} color={activeTheme.colors.textMuted} />
              <Text style={styles.emptyText}>No live movie channels found for this genre.</Text>
            </View>
          }
        />
      )}

      {/* 🆕 New Movies Portal Mode (Movie API - Lazily Loaded) */}
      {movieTab === 'new' && (
        <>
          {isLoadingNewMovies ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={activeTheme.colors.accentLight} />
              <Text style={styles.loadingText}>Loading New Movies Catalog...</Text>
            </View>
          ) : (
            <FlatList
              key={`new-movies-${numColumns}`}
              data={filteredNewMovies}
              keyExtractor={movieKeyExtractor}
              numColumns={numColumns}
              ListHeaderComponent={TopHeaderSection}
              renderItem={renderNewMovieCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listPadding}
              columnWrapperStyle={styles.columnWrapper}
              initialNumToRender={8}
              maxToRenderPerBatch={6}
              windowSize={3}
              removeClippedSubviews={Platform.OS === 'android'}
              updateCellsBatchingPeriod={50}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="film-outline" size={44} color={activeTheme.colors.textMuted} />
                  <Text style={styles.emptyText}>No new releases found in this category.</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Full OTT Movie Detail Modal */}
      {selectedMovieDetail && (
        <Modal
          visible={selectedMovieDetail !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedMovieDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedMovieDetail(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderPosterWrapper}>
                  <Image
                    source={{ uri: selectedMovieDetail.bannerUrl || selectedMovieDetail.posterUrl }}
                    style={styles.modalBannerImage}
                  />
                  <View style={styles.modalBannerOverlay} />
                  <View style={styles.modalPosterOverInfo}>
                    <Image
                      source={{ uri: selectedMovieDetail.posterUrl }}
                      style={styles.modalThumbPoster}
                    />
                    <View style={styles.modalMainHeadText}>
                      <Text style={styles.modalTitleText}>{selectedMovieDetail.title}</Text>
                      {selectedMovieDetail.originalTitle && (
                        <Text style={styles.modalOrigTitle}>{selectedMovieDetail.originalTitle}</Text>
                      )}
                      <View style={styles.modalTagsRow}>
                        <View style={styles.modalStarBadge}>
                          <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 3 }} />
                          <Text style={styles.modalStarText}>{selectedMovieDetail.rating}</Text>
                        </View>
                        <Text style={styles.modalMetaInfoText}>
                          {selectedMovieDetail.releaseYear} • {selectedMovieDetail.duration} • {selectedMovieDetail.quality}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.modalBodyPadding}>
                  <TouchableOpacity
                    style={styles.modalPlayStreamBtn}
                    onPress={() => handlePlayMovie(selectedMovieDetail)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play-circle" size={22} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.modalPlayStreamBtnText}>Play Movie Stream</Text>
                  </TouchableOpacity>

                  <Text style={styles.modalSectionHeading}>Overview</Text>
                  <Text style={styles.modalOverviewText}>{selectedMovieDetail.overview}</Text>

                  {selectedMovieDetail.cast && selectedMovieDetail.cast.length > 0 && (
                    <>
                      <Text style={styles.modalSectionHeading}>Cast</Text>
                      <Text style={styles.modalSubInfoText}>{selectedMovieDetail.cast.join(', ')}</Text>
                    </>
                  )}

                  {selectedMovieDetail.director && (
                    <>
                      <Text style={styles.modalSectionHeading}>Director</Text>
                      <Text style={styles.modalSubInfoText}>{selectedMovieDetail.director}</Text>
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export const MoviesScreen = React.memo(MoviesScreenComponent);

const getStyles = (theme: ThemePalette, isSmallScreen: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    listPadding: {
      paddingBottom: 80,
    },
    columnWrapper: {
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
    },
    sectionHeaderPadding: {
      paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
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
      fontSize: isSmallScreen ? 11.5 : 13,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    topTabTextActive: {
      color: '#FFF',
      fontWeight: '800',
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
    featuredHero: {
      height: isSmallScreen ? 200 : 230,
      marginHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      marginTop: 4,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      position: 'relative',
      justifyContent: 'flex-end',
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    heroBgImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    heroGradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
    },
    heroDetails: {
      padding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      zIndex: 2,
    },
    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    heroPopBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 153, 0, 0.25)',
      borderWidth: 1,
      borderColor: '#FF9900',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      marginRight: 8,
    },
    heroPopBadgeText: {
      color: '#FF9900',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    heroRatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    heroRatingText: {
      color: '#FBBF24',
      fontSize: 10,
      fontWeight: '800',
    },
    heroTitleText: {
      fontSize: isSmallScreen ? 18 : 22,
      fontWeight: '900',
      color: '#FFF',
    },
    heroMetaText: {
      fontSize: 11,
      color: theme.colors.accentLight,
      fontWeight: '700',
      marginTop: 2,
    },
    heroOverviewText: {
      fontSize: isSmallScreen ? 11 : 12,
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 4,
      lineHeight: 16,
    },
    heroPlayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      marginTop: 10,
    },
    heroPlayBtnText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '800',
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
    movieCard: {
      width: isSmallScreen ? '48.5%' : '31.5%',
      backgroundColor: theme.colors.cardBg,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    vodMovieCard: {
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
    vodPosterWrapper: {
      height: isSmallScreen ? 140 : 165,
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
    vodQualityBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.85)',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#10B981',
    },
    vodQualityText: {
      color: '#10B981',
      fontSize: 8.5,
      fontWeight: '900',
    },
    ratingBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    ratingBadgeText: {
      color: '#FFF',
      fontSize: 9.5,
      fontWeight: '800',
    },
    newReleaseTag: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    newReleaseText: {
      color: '#FFF',
      fontSize: 8.5,
      fontWeight: '900',
    },
    cardInfo: {
      padding: theme.spacing.xs,
    },
    vodCardInfo: {
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    modalCloseBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 20,
      padding: 6,
    },
    modalHeaderPosterWrapper: {
      height: 180,
      width: '100%',
      position: 'relative',
      justifyContent: 'flex-end',
    },
    modalBannerImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },
    modalBannerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
    },
    modalPosterOverInfo: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 14,
      zIndex: 2,
    },
    modalThumbPoster: {
      width: 75,
      height: 110,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.accentLight,
    },
    modalMainHeadText: {
      flex: 1,
      marginLeft: 12,
    },
    modalTitleText: {
      fontSize: 18,
      fontWeight: '900',
      color: '#FFF',
    },
    modalOrigTitle: {
      fontSize: 12,
      color: theme.colors.accentLight,
      fontWeight: '700',
      marginTop: 1,
    },
    modalTagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    modalStarBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },
    modalStarText: {
      color: '#FBBF24',
      fontSize: 11,
      fontWeight: '800',
    },
    modalMetaInfoText: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    modalBodyPadding: {
      padding: 16,
      paddingBottom: 40,
    },
    modalPlayStreamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      marginBottom: 16,
    },
    modalPlayStreamBtnText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '800',
    },
    modalSectionHeading: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginTop: 10,
      marginBottom: 4,
    },
    modalOverviewText: {
      fontSize: 12.5,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    modalSubInfoText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
  });
