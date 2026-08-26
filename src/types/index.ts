export interface Channel {
  id: string;
  name: string;
  logo?: string;
  category: string;
  categories?: string[];
  country?: string;
  language?: string; // 'hi' | 'mr' | 'en' | 'reg'
  languages?: string[];
  url: string;
  tvgId?: string;
  isFavorite?: boolean;
  quality?: string;
  priorityRank?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  url?: string;
  categoryKeys: string[];
  count?: number;
}

export interface CountryItem {
  code: string;
  name: string;
  flag: string;
  url?: string;
}

export interface LanguageItem {
  code: string;
  name: string;
  localName: string;
  flag: string;
}

export interface VideoQualityLevel {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  label: string; // e.g. "1080p", "720p", "480p", "360p", "Auto"
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  posterUrl: string;
  bannerUrl?: string;
  rating: number; // e.g. 8.8
  releaseYear: number; // e.g. 2024
  duration: string; // e.g. "2h 15m"
  genres: string[]; // ["Marathi", "Action", "Drama"]
  language: 'mr' | 'hi' | 'en' | string;
  overview: string;
  cast?: string[];
  director?: string;
  streamUrl: string;
  quality?: string; // "4K Ultra HD" | "1080p Full HD"
  isNewRelease?: boolean;
  isTrending?: boolean;
}

export interface StreamState {
  currentChannel: Channel | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
  qualityLevel: number; // -1 for auto
}

