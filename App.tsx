import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  Platform,
} from 'react-native';
import { Header } from './src/components/Header';
import { CategoryPicker } from './src/components/CategoryPicker';
import { CountryPicker } from './src/components/CountryPicker';
import { LanguagePicker } from './src/components/LanguagePicker';
import { ChannelGrid } from './src/components/ChannelGrid';
import { TVPlayer } from './src/components/TVPlayer';
import { ChannelDetailModal } from './src/components/ChannelDetailModal';
import { SettingsScreen } from './src/components/SettingsScreen';
import { MoviesScreen } from './src/components/MoviesScreen';
import { BottomNavBar, TabType } from './src/components/BottomNavBar';
import { SpotlightBanner } from './src/components/SpotlightBanner';
import { IPTVService } from './src/services/iptvService';
import { StorageService, UserProfile } from './src/services/storageService';
import { Channel } from './src/types';
import { darkTheme, lightTheme, ThemePalette } from './src/styles/theme';

export default function App() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null); // Default: null
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IN'); // Default: India
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [detailChannel, setDetailChannel] = useState<Channel | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true); // Header categories slider toggle
  const searchInputRef = useRef<TextInput | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    userName: 'Naitik Pawar',
    defaultQuality: 'Auto',
    fastModeEnabled: true,
    themeMode: 'dark',
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');

  const activeTheme: ThemePalette = userProfile.themeMode === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Hotkey Navigation Support (Key 9 for Search, Key 0 for Filters)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === '9') {
        e.preventDefault();
        setActiveTab('home');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      } else if (e.key === '0') {
        e.preventDefault();
        setIsFilterOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    const [savedFavs, savedProfile] = await Promise.all([
      StorageService.getFavorites(),
      StorageService.getUserProfile(),
    ]);

    setFavorites(savedFavs);
    setUserProfile(savedProfile);

    await loadAllJsonChannels();
  };

  const loadAllJsonChannels = async () => {
    setIsLoading(true);
    try {
      const channels = await IPTVService.loadFromChannelsJson();
      setAllChannels(channels);
    } catch (e) {
      console.warn('Failed to load JSON channels:', e);
      setAllChannels(IPTVService.getSampleChannels());
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (channelId: string) => {
    const updated = await StorageService.toggleFavorite(channelId);
    setFavorites(updated);
  };

  const handleSelectChannel = (channel: Channel) => {
    setPlayingChannel(channel);
    StorageService.addRecentChannel(channel);
  };

  const handleClosePlayer = () => {
    setPlayingChannel(null);
  };

  const getFilteredChannels = (): Channel[] => {
    let sourceChannels = allChannels;

    if (activeTab === 'favorites') {
      sourceChannels = allChannels.filter((ch) => favorites.includes(ch.id));
    }

    return IPTVService.filterChannels(
      sourceChannels,
      searchQuery,
      selectedCategoryId,
      selectedCountryCode,
      selectedLanguageCode
    );
  };

  const filteredChannels = getFilteredChannels();

  const handleNextChannel = () => {
    if (!playingChannel || filteredChannels.length === 0) return;
    const currentIndex = filteredChannels.findIndex((c) => c.id === playingChannel.id);
    if (currentIndex !== -1 && currentIndex < filteredChannels.length - 1) {
      handleSelectChannel(filteredChannels[currentIndex + 1]);
    }
  };

  const handlePrevChannel = () => {
    if (!playingChannel || filteredChannels.length === 0) return;
    const currentIndex = filteredChannels.findIndex((c) => c.id === playingChannel.id);
    if (currentIndex > 0) {
      handleSelectChannel(filteredChannels[currentIndex - 1]);
    }
  };

  const dynamicStyles = getStyles(activeTheme);

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <StatusBar
        barStyle={activeTheme.mode === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={activeTheme.colors.cardBg}
      />

      <View style={dynamicStyles.mainContainer}>
        {/* Full-screen OTT Stream Player */}
        {playingChannel ? (
          <View style={dynamicStyles.streamScreenContainer}>
            <TVPlayer
              channel={playingChannel}
              onClosePlayer={handleClosePlayer}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
            />
          </View>
        ) : (
          <>
            {/* Top Single-Line Header */}
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              channelCount={allChannels.length}
              isFilterOpen={isFilterOpen}
              onToggleFilterDrawer={() => setIsFilterOpen(!isFilterOpen)}
              activeFilterCount={
                (selectedCategoryId !== 'all' ? 1 : 0) +
                (selectedLanguageCode !== 'all' ? 1 : 0) +
                (selectedCountryCode !== 'IN' ? 1 : 0)
              }
              searchInputRef={searchInputRef}
              activeTheme={activeTheme}
            />

            {/* Profile Greeting Bar */}
            <View style={dynamicStyles.greetingBar}>
              <Text style={dynamicStyles.greetingText}>
                Welcome back, <Text style={dynamicStyles.userHighlight}>{userProfile.userName}</Text> 👋
              </Text>
              <Text style={dynamicStyles.greetingSub}>
                {activeTab === 'movies' ? 'Movies & Live Cinema Portal' : activeTab === 'favorites' ? 'Your Saved Favorites' : activeTab === 'settings' ? 'OTT App Preferences' : 'Press 9 for Search • Press 0 for Filters'}
              </Text>
            </View>

            {/* Tab 1 & 3: Home & Favorites Views */}
            {(activeTab === 'home' || activeTab === 'favorites') && (
              <View style={dynamicStyles.tabContent}>
                {activeTab === 'home' && isFilterOpen && (
                  <View style={dynamicStyles.filterSlidersContainer}>
                    {/* Language Filters Slider */}
                    <LanguagePicker
                      selectedLanguageCode={selectedLanguageCode}
                      onSelectLanguage={setSelectedLanguageCode}
                      activeTheme={activeTheme}
                    />

                    {/* Category Filters Slider */}
                    <CategoryPicker
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={setSelectedCategoryId}
                      activeTheme={activeTheme}
                    />

                    {/* Country Filter Chips */}
                    <CountryPicker
                      selectedCountryCode={selectedCountryCode}
                      onSelectCountry={setSelectedCountryCode}
                      activeTheme={activeTheme}
                    />
                  </View>
                )}

                {/* Trending Spotlight Live Banner Carousel */}
                {activeTab === 'home' && searchQuery === '' && (
                  <SpotlightBanner
                    channels={filteredChannels}
                    onSelectChannel={handleSelectChannel}
                    activeTheme={activeTheme}
                  />
                )}

                {/* Device-Responsive Channel Grid */}
                <View style={dynamicStyles.gridWrapper}>
                  <ChannelGrid
                    channels={filteredChannels}
                    playingChannelId={null}
                    favorites={favorites}
                    isLoading={isLoading}
                    onSelectChannel={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    onRefresh={loadAllJsonChannels}
                    activeTheme={activeTheme}
                  />
                </View>
              </View>
            )}

            {/* Tab 2: Dedicated Movies Portal */}
            {activeTab === 'movies' && (
              <MoviesScreen
                movieChannels={allChannels.filter((c) => {
                  const cat = c.category.toLowerCase();
                  const name = c.name.toLowerCase();
                  return cat.includes('movie') || cat.includes('cinema') || cat.includes('film') || name.includes('movie') || name.includes('cinema') || name.includes('goldmines') || name.includes('bollywood');
                })}
                onSelectMovie={handleSelectChannel}
                activeTheme={activeTheme}
              />
            )}

            {/* Tab 4: Settings Screen */}
            {activeTab === 'settings' && (
              <SettingsScreen
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
                channelCount={allChannels.length}
                onReloadChannels={loadAllJsonChannels}
              />
            )}

            {/* Bottom OTT Navigation Bar */}
            <BottomNavBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              favoritesCount={favorites.length}
              activeTheme={activeTheme}
            />
          </>
        )}

        {/* Channel Details Modal */}
        <ChannelDetailModal
          channel={detailChannel}
          visible={detailChannel !== null}
          isFavorite={detailChannel ? favorites.includes(detailChannel.id) : false}
          onClose={() => setDetailChannel(null)}
          onPlay={handleSelectChannel}
          onToggleFavorite={handleToggleFavorite}
        />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    streamScreenContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    greetingBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      backgroundColor: theme.mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.03)',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    greetingText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    userHighlight: {
      fontWeight: '800',
      color: theme.colors.accentLight,
    },
    greetingSub: {
      fontSize: 10,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    tabContent: {
      flex: 1,
    },
    filterSlidersContainer: {
      backgroundColor: theme.colors.cardBg,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    gridWrapper: {
      flex: 1,
    },
  });
