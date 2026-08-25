import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel } from '../types';

const FAVORITES_KEY = '@mytv_favorites_v1';
const RECENT_KEY = '@mytv_recent_v1';
const USER_PROFILE_KEY = '@mytv_user_profile';

export interface UserProfile {
  userName: string;
  defaultQuality: string; // 'Auto', '1080p', '720p', '480p'
  fastModeEnabled: boolean;
  themeMode?: 'dark' | 'light';
}

export const StorageService = {
  async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error reading favorites:', e);
      return [];
    }
  },

  async toggleFavorite(channelId: string): Promise<string[]> {
    try {
      const favorites = await this.getFavorites();
      let updated: string[];
      if (favorites.includes(channelId)) {
        updated = favorites.filter((id) => id !== channelId);
      } else {
        updated = [...favorites, channelId];
      }
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Error saving favorite:', e);
      return [];
    }
  },

  async getRecentChannels(): Promise<Channel[]> {
    try {
      const data = await AsyncStorage.getItem(RECENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error reading recent channels:', e);
      return [];
    }
  },

  async addRecentChannel(channel: Channel): Promise<void> {
    try {
      const recent = await this.getRecentChannels();
      const filtered = recent.filter((c) => c.id !== channel.id);
      const updated = [channel, ...filtered].slice(0, 20); // Keep top 20
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error adding recent channel:', e);
    }
  },

  async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading user profile:', e);
    }
    return {
      userName: 'Naitik Pawar',
      defaultQuality: 'Auto',
      fastModeEnabled: true,
      themeMode: 'dark',
    };
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Error saving user profile:', e);
    }
  },

  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Error clearing cache:', e);
    }
  },
};
