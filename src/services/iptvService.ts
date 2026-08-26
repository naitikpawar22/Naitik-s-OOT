import { Channel } from '../types';
import { CATEGORIES } from '../constants/categories';

export const CHANNELS_JSON_URL = 'https://iptv-org.github.io/api/channels.json';
export const STREAMS_JSON_URL = 'https://iptv-org.github.io/api/streams.json';
export const M3U_INDEX_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export interface RawApiChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string | null;
  owners?: string[];
  country?: string;
  categories?: string[];
  languages?: string[];
  is_nsfw?: boolean;
  website?: string | null;
}

export interface RawApiStream {
  channel?: string | null;
  feed?: string | null;
  title: string;
  url: string;
  quality?: string | null;
  label?: string | null;
}

let cachedChannels: Channel[] | null = null;
let fetchPromise: Promise<Channel[]> | null = null;

// Rich curated channels prioritized for Marathi, Hindi, Kids, News, Devotional & Movies
const SAMPLE_CHANNELS: Channel[] = [
  {
    id: 'sample-marathi-1',
    name: 'ABP Majha (Marathi News)',
    logo: 'https://dtil.tmsimg.com/assets/s142521_ld_h15_aa.png?lock=720x540',
    category: 'News',
    categories: ['news', 'marathi'],
    country: 'IN',
    language: 'mr',
    languages: ['mr', 'mar'],
    quality: '720p',
    url: 'https://ndtvndtv24x7hls-lh.akamaihd.net/i/ndtv24x7_1@505809/master.m3u8',
    tvgId: 'ABPMajha.in',
  },
  {
    id: 'sample-marathi-2',
    name: 'Zee 24 Taas (Marathi Live)',
    logo: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_ZEE_MARATHI/images/LOGO_HD/LOGO_HD_image.png',
    category: 'News',
    categories: ['news', 'marathi'],
    country: 'IN',
    language: 'mr',
    languages: ['mr', 'mar'],
    quality: '1080p',
    url: 'https://content.uplynk.com/channel/3324f2e670c949259066db105f7d06e4.m3u8',
    tvgId: 'Zee24Taas.in',
  },
  {
    id: 'sample-marathi-3',
    name: 'Colors Marathi HD (Serials & Shows)',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/ColorsMarathi.in.png',
    category: 'Entertainment',
    categories: ['entertainment', 'marathi'],
    country: 'IN',
    language: 'mr',
    languages: ['mr', 'mar'],
    quality: '1080p',
    url: 'https://euronews-euronews-live-1-eu.rakuten.wurl.tv/playlist.m3u8',
    tvgId: 'ColorsMarathi.in',
  },
  {
    id: 'sample-marathi-4',
    name: 'Saam TV Marathi News',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/SaamTV.in.png',
    category: 'News',
    categories: ['news', 'marathi'],
    country: 'IN',
    language: 'mr',
    languages: ['mr', 'mar'],
    quality: '720p',
    url: 'https://ndtvndtv24x7hls-lh.akamaihd.net/i/ndtv24x7_1@505809/master.m3u8',
    tvgId: 'SaamTV.in',
  },
  {
    id: 'sample-marathi-5',
    name: 'News18 Lokmat (Marathi)',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/News18Lokmat.in.png',
    category: 'News',
    categories: ['news', 'marathi'],
    country: 'IN',
    language: 'mr',
    languages: ['mr', 'mar'],
    quality: '720p',
    url: 'https://content.uplynk.com/channel/3324f2e670c949259066db105f7d06e4.m3u8',
    tvgId: 'News18Lokmat.in',
  },
  {
    id: 'sample-hindi-1',
    name: 'Aaj Tak (Hindi News)',
    logo: 'https://dtil.tmsimg.com/assets/s90012_ld_h15_aa.png?lock=720x540',
    category: 'News',
    categories: ['news', 'hindi'],
    country: 'IN',
    language: 'hi',
    languages: ['hi', 'hin'],
    quality: '1080p',
    url: 'https://content.uplynk.com/channel/3324f2e670c949259066db105f7d06e4.m3u8',
    tvgId: 'AajTak.in',
  },
  {
    id: 'sample-hindi-2',
    name: 'NDTV India (Hindi)',
    logo: 'https://i.imgur.com/9P33gHk.png',
    category: 'News',
    categories: ['news', 'hindi'],
    country: 'IN',
    language: 'hi',
    languages: ['hi', 'hin'],
    quality: '1080p',
    url: 'https://ndtvndtv24x7hls-lh.akamaihd.net/i/ndtv24x7_1@505809/master.m3u8',
    tvgId: 'NDTVIndia.in',
  },
  {
    id: 'sample-hindi-movies-1',
    name: 'Bollywood Movies TV (Hindi Cinema)',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/StarGold.in.png',
    category: 'Movies',
    categories: ['movies', 'hindi', 'cinema'],
    country: 'IN',
    language: 'hi',
    languages: ['hi', 'hin'],
    quality: '1080p',
    url: 'https://euronews-euronews-live-1-eu.rakuten.wurl.tv/playlist.m3u8',
    tvgId: 'StarGold.in',
  },
  {
    id: 'sample-kids-1',
    name: 'Nickelodeon Kids TV',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/Nickelodeon.us.png',
    category: 'Kids',
    categories: ['kids', 'animation'],
    country: 'IN',
    language: 'hi',
    languages: ['hi', 'en'],
    quality: '720p',
    url: 'https://euronews-euronews-live-1-eu.rakuten.wurl.tv/playlist.m3u8',
    tvgId: 'Nickelodeon.in',
  },
  {
    id: 'sample-kids-2',
    name: 'Cartoon Network Kids',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/CartoonNetwork.us.png',
    category: 'Kids',
    categories: ['kids', 'animation'],
    country: 'IN',
    language: 'hi',
    languages: ['hi', 'en'],
    quality: '1080p',
    url: 'https://content.uplynk.com/channel/3324f2e670c949259066db105f7d06e4.m3u8',
    tvgId: 'CartoonNetwork.in',
  },
  {
    id: 'sample-devotional-1',
    name: 'Aastha TV (Bhakti / Devotional)',
    logo: 'https://raw.githubusercontent.com/iptv-org/iptv/master/logos/AasthaTV.in.png',
    category: 'Devotional',
    categories: ['devotional', 'religious'],
    country: 'IN',
    language: 'hi',
    languages: ['hi', 'hin'],
    quality: '720p',
    url: 'https://ndtvndtv24x7hls-lh.akamaihd.net/i/ndtv24x7_1@505809/master.m3u8',
    tvgId: 'AasthaTV.in',
  },
];

export const IPTVService = {
  /**
   * Fetch channels, streams, and m3u logo dictionary concurrently
   */
  async loadFromChannelsJson(): Promise<Channel[]> {
    if (cachedChannels) {
      return cachedChannels;
    }

    if (fetchPromise) {
      return fetchPromise;
    }

    fetchPromise = (async () => {
      try {
        const [channelsRes, streamsRes, m3uText] = await Promise.all([
          fetch(CHANNELS_JSON_URL),
          fetch(STREAMS_JSON_URL),
          fetch(M3U_INDEX_URL).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
        ]);

        if (!channelsRes.ok || !streamsRes.ok) {
          throw new Error('Failed to fetch JSON endpoints from iptv-org.');
        }

        const rawChannels: RawApiChannel[] = await channelsRes.json();
        const rawStreams: RawApiStream[] = await streamsRes.json();

        // Parse m3u index text to map tvg-id -> real channel tvg-logo URL
        const logoMap = new Map<string, string>();
        if (m3uText) {
          const lines = m3uText.split('\n');
          lines.forEach((line) => {
            if (line.startsWith('#EXTINF:')) {
              const idMatch = line.match(/tvg-id="([^"]+)"/);
              const logoMatch = line.match(/tvg-logo="([^"]+)"/);
              if (idMatch && logoMatch && logoMatch[1]) {
                const cleanId = idMatch[1].split('@')[0];
                logoMap.set(cleanId, logoMatch[1]);
              }
            }
          });
        }

        // Map raw channels by channel ID (including adult / nsfw channels)
        const channelMap = new Map<string, RawApiChannel>();
        rawChannels.forEach((ch) => {
          channelMap.set(ch.id, ch);
        });

        const mergedList: Channel[] = [];

        rawStreams.forEach((stream, index) => {
          if (!stream.url) return;

          let chMeta: RawApiChannel | undefined;
          if (stream.channel) {
            chMeta = channelMap.get(stream.channel);
          }

          const channelId = stream.channel || `str_${index}`;
          const channelName = chMeta ? chMeta.name : stream.title || 'Live TV Channel';
          const qualityStr = stream.quality || (stream.title && stream.title.includes('1080') ? '1080p' : stream.title && stream.title.includes('720') ? '720p' : '576p');
          const qualitySuffix = stream.quality ? ` (${stream.quality})` : '';

          const rawCats = chMeta?.categories || [];
          let mainCategoryDisplay = 'General';
          if (rawCats.length > 0) {
            mainCategoryDisplay = rawCats[0].charAt(0).toUpperCase() + rawCats[0].slice(1);
          }

          const countryCode = chMeta ? chMeta.country : undefined;
          const rawLangs = chMeta?.languages || [];
          const nameLower = channelName.toLowerCase();
          const idLower = channelId.toLowerCase();

          // Adult / NSFW Channel Flag
          const isAdult =
            chMeta?.is_nsfw === true ||
            rawCats.includes('xxx') ||
            nameLower.includes('xxx') ||
            idLower.includes('xxx') ||
            nameLower.includes('adult') ||
            nameLower.includes('playboy') ||
            nameLower.includes('hustler') ||
            nameLower.includes('penthouse') ||
            nameLower.includes('brazzers') ||
            nameLower.includes('dorcel') ||
            nameLower.includes('redlight') ||
            nameLower.includes('vivid') ||
            nameLower.includes('exotic');

          // Intelligent detection for Marathi (mr), Hindi (hi), English (en), Regional (reg)
          let detectedLang = 'reg';

          if (
            rawLangs.includes('mar') ||
            rawLangs.includes('mr') ||
            nameLower.includes('marathi') ||
            nameLower.includes('majha') ||
            nameLower.includes('lokmat') ||
            nameLower.includes('saam') ||
            nameLower.includes('taas') ||
            nameLower.includes('pravah') ||
            nameLower.includes('fakht') ||
            nameLower.includes('fakt') ||
            nameLower.includes('mkn') ||
            nameLower.includes('sahyadri') ||
            nameLower.includes('jai maharashtra')
          ) {
            detectedLang = 'mr';
          } else if (
            rawLangs.includes('hin') ||
            rawLangs.includes('hi') ||
            nameLower.includes('hindi') ||
            nameLower.includes('tak') ||
            nameLower.includes('bharat') ||
            nameLower.includes('aaj') ||
            nameLower.includes('ndtv india') ||
            nameLower.includes('sanskar') ||
            nameLower.includes('aastha') ||
            nameLower.includes('zee news') ||
            nameLower.includes('abp news') ||
            nameLower.includes('news18 india') ||
            nameLower.includes('tv9 bharatvarsh') ||
            nameLower.includes('india tv') ||
            nameLower.includes('republic bharat') ||
            nameLower.includes('dangal') ||
            nameLower.includes('manoranjan')
          ) {
            detectedLang = 'hi';
          } else if (
            rawLangs.includes('eng') ||
            nameLower.includes('ndtv 24x7') ||
            nameLower.includes('republic tv') ||
            nameLower.includes('times now') ||
            nameLower.includes('india today') ||
            nameLower.includes('cnn-news18') ||
            nameLower.includes('wion') ||
            nameLower.includes('mirror now') ||
            nameLower.includes('dd india') ||
            nameLower.includes('star sports')
          ) {
            detectedLang = 'en';
          }

          // Real Logo URL extraction
          let channelLogoUrl = logoMap.get(channelId);
          if (!channelLogoUrl && stream.channel) {
            channelLogoUrl = `https://raw.githubusercontent.com/iptv-org/iptv/master/logos/${stream.channel}.png`;
          }
          if (!channelLogoUrl) {
            channelLogoUrl = `https://iptv-org.github.io/iptv/logos/${channelId}.png`;
          }

          const priorityRank =
            detectedLang === 'mr' ||
            nameLower.includes('marathi') ||
            nameLower.includes('majha') ||
            nameLower.includes('lokmat') ||
            nameLower.includes('saam') ||
            nameLower.includes('taas') ||
            nameLower.includes('pravah') ||
            nameLower.includes('sahyadri')
              ? 1
              : detectedLang === 'hi' ||
                nameLower.includes('hindi') ||
                nameLower.includes('tak') ||
                nameLower.includes('aaj tak') ||
                nameLower.includes('ndtv india') ||
                nameLower.includes('zee news') ||
                nameLower.includes('abp news') ||
                nameLower.includes('dangal') ||
                nameLower.includes('goldmines') ||
                nameLower.includes('bollywood')
              ? 2
              : countryCode === 'IN'
              ? 3
              : 4;

          mergedList.push({
            id: `${channelId}_${index}`,
            name: `${channelName}${qualitySuffix}`,
            logo: channelLogoUrl,
            category: mainCategoryDisplay,
            categories: rawCats,
            country: countryCode,
            language: detectedLang,
            languages: rawLangs,
            quality: qualityStr,
            url: stream.url,
            tvgId: channelId,
            priorityRank,
            isNsfw: isAdult,
          });
        });

        if (mergedList.length === 0) {
          cachedChannels = SAMPLE_CHANNELS;
        } else {
          cachedChannels = mergedList;
        }

        return cachedChannels;
      } catch (error) {
        console.warn('Failed to load iptv-org channels.json / streams.json:', error);
        cachedChannels = SAMPLE_CHANNELS;
        return SAMPLE_CHANNELS;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },

  /**
   * Enhanced Filter & Priority Sorting for Marathi & Hindi Channels
   */
  filterChannels(
    channelsList: Channel[],
    searchQuery: string,
    selectedCategoryId: string,
    selectedCountryCode: string,
    selectedLanguageCode: string
  ): Channel[] {
    const q = searchQuery.trim().toLowerCase();
    const catId = selectedCategoryId.trim().toLowerCase();
    const countryCode = selectedCountryCode.trim().toLowerCase();
    const langCode = selectedLanguageCode.trim().toLowerCase();

    const catItem = CATEGORIES.find((c) => c.id === catId);
    const catKeys = catItem ? catItem.categoryKeys.map((k) => k.toLowerCase()) : [catId];

    const filtered = channelsList.filter((ch) => {
      const nameLower = ch.name.toLowerCase();
      const idLower = (ch.tvgId || '').toLowerCase();
      const chCountry = (ch.country || '').toLowerCase();

      // Secret NSFW Content Handler:
      // Adult/XXX channels are HIDDEN from normal browsing/category filters by default.
      // They ONLY show when user explicitly types 'xxx' or 'adult' in the search bar!
      const isSearchingForAdult = q.includes('xxx') || q.includes('adult') || q.includes('sex') || q.includes('x-rated');
      if (ch.isNsfw && !isSearchingForAdult) {
        return false;
      }

      // Country Filter (Default: IN)
      if (countryCode !== 'all' && countryCode !== '') {
        if (countryCode === 'in') {
          const isIndiaChannel =
            chCountry === 'in' ||
            ch.language === 'mr' ||
            ch.language === 'hi' ||
            nameLower.includes('india') ||
            nameLower.includes('marathi') ||
            nameLower.includes('hindi') ||
            nameLower.includes('tak') ||
            nameLower.includes('majha') ||
            nameLower.includes('lokmat') ||
            nameLower.includes('star plus') ||
            nameLower.includes('star pravah') ||
            nameLower.includes('star sports') ||
            nameLower.includes('zee news') ||
            nameLower.includes('zee tv') ||
            nameLower.includes('abp news') ||
            nameLower.includes('abp majha') ||
            nameLower.includes('ndtv') ||
            nameLower.includes('tv9') ||
            nameLower.includes('dangal');

          if (!isIndiaChannel) {
            return false;
          }
        } else if (chCountry !== countryCode) {
          return false;
        }
      }

      // Language Filter (Marathi, Hindi, English, Regional)
      if (langCode !== 'all' && langCode !== '') {
        if (langCode === 'mr') {
          const isMarathi =
            ch.language === 'mr' ||
            nameLower.includes('marathi') ||
            nameLower.includes('majha') ||
            nameLower.includes('lokmat') ||
            nameLower.includes('saam') ||
            nameLower.includes('taas') ||
            nameLower.includes('pravah') ||
            nameLower.includes('fakht') ||
            nameLower.includes('fakt') ||
            nameLower.includes('mkn') ||
            nameLower.includes('sahyadri');
          if (!isMarathi) return false;
        } else if (langCode === 'hi') {
          const isHindi =
            ch.language === 'hi' ||
            nameLower.includes('hindi') ||
            nameLower.includes('tak') ||
            nameLower.includes('bharat') ||
            nameLower.includes('aaj tak') ||
            nameLower.includes('sanskar') ||
            nameLower.includes('aastha') ||
            nameLower.includes('zee news') ||
            nameLower.includes('abp news') ||
            nameLower.includes('news18 india') ||
            nameLower.includes('tv9 bharatvarsh') ||
            nameLower.includes('dangal') ||
            nameLower.includes('manoranjan');
          if (!isHindi) return false;
        } else if (ch.language !== langCode) {
          return false;
        }
      }

      // Category Filter (Marathi Special, Hindi Special, Kids, News, Devotional, Movies, etc.)
      if (catId !== 'all' && catId !== '') {
        const chCats = (ch.categories || []).map((c) => c.toLowerCase());
        chCats.push(ch.category.toLowerCase());

        // News Channel Detection Helper
        const isNews =
          ch.category.toLowerCase().includes('news') ||
          chCats.some((c) => c.includes('news')) ||
          ['news', 'samachar', 'taas', 'majha', 'lokmat', 'saam', 'tak', 'khabar', 'patrika', 'bulletin', '24x7', 'tv9', 'abp', 'ndtv', 'republic', 'wion', 'cnbc', 'cnn', 'indiatv', 'india today', 'times now', 'mirror now', 'jai maharashtra'].some(
            (kw) => nameLower.includes(kw) || idLower.includes(kw)
          );

        let matchesCategory = false;

        if (catId === 'news') {
          // Dedicated News Section: Shows ALL Marathi, Hindi, & Global News Channels
          matchesCategory = isNews;
        } else if (catId === 'marathi') {
          // Marathi Special: All Marathi Channels (Entertainment, Serials, Music, Movies), EXCLUDING News
          const isMarathi =
            ch.language === 'mr' ||
            (ch.languages && ch.languages.includes('mr')) ||
            nameLower.includes('marathi') ||
            nameLower.includes('pravah') ||
            nameLower.includes('fakht') ||
            nameLower.includes('fakt') ||
            nameLower.includes('mkn') ||
            nameLower.includes('sahyadri') ||
            nameLower.includes('maiboli') ||
            nameLower.includes('planet marathi');

          matchesCategory = isMarathi && !isNews;
        } else if (catId === 'hindi') {
          // Hindi Special: All Hindi Channels (Entertainment, Movies, Serials), EXCLUDING News
          const isHindi =
            ch.language === 'hi' ||
            (ch.languages && ch.languages.includes('hi')) ||
            nameLower.includes('hindi') ||
            nameLower.includes('bharat') ||
            nameLower.includes('star plus') ||
            nameLower.includes('colors') ||
            nameLower.includes('sony') ||
            nameLower.includes('zee tv') ||
            nameLower.includes('dangal') ||
            nameLower.includes('manoranjan') ||
            nameLower.includes('goldmines') ||
            nameLower.includes('bollywood');

          matchesCategory = isHindi && !isNews;
        } else if (catId === 'kids') {
          const kidsKeywords = ['kid', 'kids', 'toon', 'toons', 'cartoon', 'disney', 'nick', 'nickelodeon', 'hungama', 'sonic', 'pogo', 'junior', 'baby', 'cbeebies', 'duck', 'chotu', 'bal'];
          matchesCategory = kidsKeywords.some((kw) => nameLower.includes(kw) || idLower.includes(kw)) && !isNews;
        } else if (catId === 'devotional') {
          const devKeywords = ['bhakti', 'devotional', 'aastha', 'sanskar', 'sadhna', 'peace', 'god', 'gurbani', 'satsang', 'dharma', 'shradha', 'religious', 'spiritual'];
          matchesCategory = devKeywords.some((kw) => nameLower.includes(kw) || idLower.includes(kw)) && !isNews;
        } else if (catId === 'movies') {
          const movieKeywords = ['movie', 'movies', 'cinema', 'film', 'talkies', 'bollywood', 'multiplex', 'goldmines', 'b4u', 'filamchi'];
          matchesCategory = movieKeywords.some((kw) => nameLower.includes(kw) || idLower.includes(kw)) && !isNews;
        } else if (catId === 'entertainment') {
          const entKeywords = ['entertainment', 'series', 'drama', 'serial', 'comedy', 'general', 'star', 'colors', 'sony', 'zee'];
          matchesCategory = entKeywords.some((kw) => nameLower.includes(kw) || idLower.includes(kw)) && !isNews;
        } else {
          matchesCategory = chCats.some((c) => catKeys.includes(c));
        }

        if (!matchesCategory) {
          return false;
        }
      }

      // Search Query Filter
      if (q !== '') {
        const nameMatch = nameLower.includes(q);
        const catMatch = ch.category.toLowerCase().includes(q);
        const countryMatch = chCountry.includes(q);
        const idMatch = idLower.includes(q);

        return nameMatch || catMatch || countryMatch || idMatch;
      }

      return true;
    });

    // Priority Sort: Fast Integer Subtraction
    return filtered.sort((a, b) => (a.priorityRank || 4) - (b.priorityRank || 4));
  },

  getSampleChannels(): Channel[] {
    return SAMPLE_CHANNELS;
  },

  clearCache() {
    cachedChannels = null;
  },
};
