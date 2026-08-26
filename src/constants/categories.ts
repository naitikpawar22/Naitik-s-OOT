import { CategoryItem, CountryItem, LanguageItem } from '../types';

export const LANGUAGES: LanguageItem[] = [
  {
    code: 'all',
    name: 'All Languages',
    localName: 'सभी भाषाएँ',
    flag: '🌐',
  },
  {
    code: 'mr',
    name: 'Marathi',
    localName: 'मराठी',
    flag: '🚩',
  },
  {
    code: 'hi',
    name: 'Hindi',
    localName: 'हिंदी',
    flag: '🇮🇳',
  },
  {
    code: 'en',
    name: 'English',
    localName: 'English',
    flag: '🇬🇧',
  },
];

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'all',
    name: 'All Channels',
    icon: 'apps',
    categoryKeys: ['all'],
  },
  {
    id: 'marathi',
    name: 'Marathi Special 🚩',
    icon: 'flag',
    categoryKeys: ['marathi', 'mr'],
  },
  {
    id: 'hindi',
    name: 'Hindi Special 🇮🇳',
    icon: 'tv',
    categoryKeys: ['hindi', 'hi'],
  },
  {
    id: 'news',
    name: 'News & Samachar 📰',
    icon: 'newspaper',
    categoryKeys: ['news', 'weather', 'legislative', 'public'],
  },
  {
    id: 'movies',
    name: 'Movies & Cinema 🍿',
    icon: 'film',
    categoryKeys: ['movies', 'classic', 'cinema', 'film'],
  },
  {
    id: 'entertainment',
    name: 'Entertainment 🎬',
    icon: 'tv-outline',
    categoryKeys: ['entertainment', 'series', 'comedy', 'general'],
  },
  {
    id: 'kids',
    name: 'Kids & Cartoons 👶',
    icon: 'happy',
    categoryKeys: ['kids', 'animation', 'family', 'cartoon'],
  },
  {
    id: 'devotional',
    name: 'Devotional / Bhakti 🕉️',
    icon: 'heart-circle',
    categoryKeys: ['religious', 'devotional', 'bhakti', 'spiritual'],
  },
];

export const COUNTRIES: CountryItem[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
  },
  {
    code: 'all',
    name: 'Global / All',
    flag: '🌐',
  },
];

export const API_ENDPOINTS = {
  channelsJson: 'https://iptv-org.github.io/api/channels.json',
  streamsJson: 'https://iptv-org.github.io/api/streams.json',
  categoriesJson: 'https://iptv-org.github.io/api/categories.json',
  countriesJson: 'https://iptv-org.github.io/api/countries.json',
};
