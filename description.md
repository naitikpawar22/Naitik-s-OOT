# StreamPulse Live TV - API & Implementation Guide

Comprehensive documentation on all IPTV channel endpoints, categories, datasets, and step-by-step developer implementation guide.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [API & Playlist Endpoints](#api--playlist-endpoints)
   - [Global Playlists](#1-global-master-playlists)
   - [Country Playlists](#2-country-playlists)
   - [Category Playlists](#3-category-playlists)
   - [JSON REST API Endpoints](#4-json-rest-api-endpoints)
3. [M3U File Format Architecture](#m3u-file-format-architecture)
4. [Step-by-Step Implementation Guides](#step-by-step-implementation-guides)
   - [Guide A: HTML5 & Vanilla JS (Web App)](#guide-a-html5--vanilla-javascript)
   - [Guide B: React / Next.js Implementation](#guide-b-react--nextjs)
   - [Guide C: React Native (Mobile & Smart TV)](#guide-c-react-native-mobile--smart-tv)
   - [Guide D: Node.js Server Integration](#guide-d-nodejs-server-integration)
5. [Best Practices & Error Handling](#best-practices--error-handling)

---

## 🌐 Overview

This codebase connects to open-source IPTV broadcast streams. Live television channels stream over the **HLS (HTTP Live Streaming)** protocol using `.m3u8` manifest URLs.

* **Stream Type:** HLS (`.m3u8`), MPD (`.mpd`), or direct HTTP video streams.
* **Metadata Included:** Channel Name, Logo Image, Category/Genre, Language, Country, and EPG (Electronic Program Guide) TVG ID.

---

## 📡 API & Playlist Endpoints

### 1. Global Master Playlists

| Playlist Name | Endpoint URL | Description |
| :--- | :--- | :--- |
| **All Channels Master** | `https://iptv-org.github.io/iptv/index.m3u` | Contains 10,000+ public live channels worldwide. |
| **Country Index** | `https://iptv-org.github.io/iptv/index.country.m3u` | Channels organized by country. |
| **Category Index** | `https://iptv-org.github.io/iptv/index.category.m3u` | Channels organized by genre/category. |
| **Language Index** | `https://iptv-org.github.io/iptv/index.language.m3u` | Channels organized by spoken language. |

---

### 2. Country Playlists
Base URL pattern: `https://iptv-org.github.io/iptv/countries/{country_code}.m3u`

| Country | Code | M3U Endpoint URL | Local Path |
| :--- | :--- | :--- | :--- |
| 🇮🇳 **India** | `in` | `https://iptv-org.github.io/iptv/countries/in.m3u` | `streams/in.m3u` |
| 🇺🇸 **USA** | `us` | `https://iptv-org.github.io/iptv/countries/us.m3u` | `streams/us.m3u` |
| 🇬🇧 **UK** | `uk` | `https://iptv-org.github.io/iptv/countries/uk.m3u` | `streams/uk.m3u` |
| 🇨🇦 **Canada** | `ca` | `https://iptv-org.github.io/iptv/countries/ca.m3u` | `streams/ca.m3u` |
| 🇧🇷 **Brazil** | `br` | `https://iptv-org.github.io/iptv/countries/br.m3u` | `streams/br.m3u` |
| 🇩🇪 **Germany** | `de` | `https://iptv-org.github.io/iptv/countries/de.m3u` | `streams/de.m3u` |
| 🇫🇷 **France** | `fr` | `https://iptv-org.github.io/iptv/countries/fr.m3u` | `streams/fr.m3u` |
| 🇦🇺 **Australia** | `au` | `https://iptv-org.github.io/iptv/countries/au.m3u` | `streams/au.m3u` |

---

### 3. Category Playlists
Base URL pattern: `https://iptv-org.github.io/iptv/categories/{category_name}.m3u`

| Category | M3U Endpoint URL |
| :--- | :--- |
| 📰 **News** | `https://iptv-org.github.io/iptv/categories/news.m3u` |
| ⚽ **Sports** | `https://iptv-org.github.io/iptv/categories/sports.m3u` |
| 🍿 **Movies** | `https://iptv-org.github.io/iptv/categories/movies.m3u` |
| 🎬 **Entertainment** | `https://iptv-org.github.io/iptv/categories/entertainment.m3u` |
| 🎵 **Music** | `https://iptv-org.github.io/iptv/categories/music.m3u` |
| 👶 **Kids** | `https://iptv-org.github.io/iptv/categories/kids.m3u` |
| 🌿 **Documentary** | `https://iptv-org.github.io/iptv/categories/documentary.m3u` |
| 💼 **Business** | `https://iptv-org.github.io/iptv/categories/business.m3u` |

---

### 4. JSON REST API Endpoints

For developers building structured APIs or React apps without parsing raw M3U text:

| Resource | REST API Endpoint (JSON) |
| :--- | :--- |
| **All Channels Data** | `https://iptv-org.github.io/api/channels.json` |
| **All Stream URLs** | `https://iptv-org.github.io/api/streams.json` |
| **Categories List** | `https://iptv-org.github.io/api/categories.json` |
| **Countries List** | `https://iptv-org.github.io/api/countries.json` |
| **Languages List** | `https://iptv-org.github.io/api/languages.json` |

---

## 📐 M3U File Format Architecture

An M3U playlist file is structured as follows:

```text
#EXTM3U
#EXTINF:-1 tvg-id="AajTak.in" tvg-logo="https://i.imgur.com/logo.png" group-title="News", Aaj Tak
https://stream-server.example.com/hls/live/master.m3u8
```

Key attributes:
* `tvg-logo`: URL to the channel icon image.
* `group-title`: Category or genre (e.g. News, Sports).
* `tvg-id`: EPG identifier to link channel broadcast guide schedule.
* **Line following `#EXTINF`**: Direct HTTP `.m3u8` live stream link.

---

## 🛠️ Step-by-Step Implementation Guides

### Guide A: HTML5 & Vanilla JavaScript

Using **HLS.js** library to play `.m3u8` streams in standard browser `<video>` elements:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Live TV Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>

  <video id="videoPlayer" controls autoplay style="width:800px; height:450px;"></video>

  <script>
    const video = document.getElementById('videoPlayer');
    const streamUrl = 'https://stream-server.example.com/hls/live/master.m3u8';

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play();
    }
  </script>
</body>
</html>
```

---

### Guide B: React / Next.js

```jsx
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ streamUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let hls;
    if (Hls.isSupported() && videoRef.current) {
      hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [streamUrl]);

  return <video ref={videoRef} controls autoPlay style={{ width: '100%', height: 'auto' }} />;
}
```

---

### Guide C: React Native (Mobile & Smart TV)

Install dependency:
```bash
npm install react-native-video
```

Implementation code:
```jsx
import React from 'react';
import Video from 'react-native-video';

export default function TVPlayer({ streamUrl }) {
  return (
    <Video
      source={{ uri: streamUrl, type: 'm3u8' }}
      controls={true}
      resizeMode="contain"
      style={{ width: '100%', height: 300 }}
      onError={(err) => console.log('Stream Error:', err)}
    />
  );
}
```

---

### Guide D: Node.js Server Integration

Parse `.m3u` files server-side using Node.js:

```javascript
const fs = require('fs');
const parser = require('iptv-playlist-parser');

const playlistText = fs.readFileSync('./streams/in.m3u', 'utf8');
const result = parser.parse(playlistText);

console.log(`Loaded ${result.items.length} channels`);
console.log(result.items[0]); 
// Output: { name: 'Aaj Tak', logo: '...', category: 'News', url: 'https://...' }
```

---

## ⚡ Best Practices & Error Handling

1. **CORS Headers:** Some channel streams enforce CORS (Cross-Origin Resource Sharing). Use HLS.js error event hooks to detect stream failure and fallback to alternative streams.
2. **Low Latency Mode:** Configure `Hls.js` with `lowLatencyMode: true` for live TV broadcasts.
3. **Image Fallbacks:** Always handle missing/broken logo URLs with CSS or placeholder initials.
4. **Favorites Persistence:** Store user preferences in `localStorage` or `AsyncStorage` (React Native).
