# Naitik's OTT / StreamPulse TV 🎬📺

A high-performance, modern OTT Live TV & Movie Streaming application built with React Native, Expo, and TypeScript. Optimized for Mobile devices, Tablets, Web, and Android TV.

![App Branding](./assets/favicon.png)

---

## ✨ Features & Key Highlights

- **🚩 Marathi & 🇮🇳 Hindi Priority Engine**: High-demand regional channels (ABP Majha, Zee 24 Taas, Colors Marathi, Saam TV, Aaj Tak, NDTV India, Sony Max, Star Gold) are automatically scored and prioritized at the top of the Home feed.
- **✨ Spotlight Broadcast Hero Carousel**: Dynamic featured broadcast hero banner showcasing live streams, quality indicators (`1080p`), and instant `Watch Now Live` playback.
- **🍿 Dedicated Movies Portal**: Specialized Movies section with **🔴 Live Movies** and **🆕 New Movies** section toggles, genre chips (**Marathi Cinema**, **Hindi Cinema**, **Action**, **Comedy**), and cinema cards.
- **📱 100% Mobile Responsive Layout**: Fluid scaling across mobile viewports, tablets, and desktop/TV screens.
- **✂️ Advanced Live Stream Controls**: Compact player layout with 3 slide-up action controls:
  - **Cut-to-Cut Screen Fit ✂️**
  - **Quality Selector ⚙️ (Auto / 1080p / 720p)**
  - **Low Data Fast Mode ⚡**
- **🌙 Dynamic Dark & ☀️ Bright Light Theme**: Interactive slide-toggle theme switcher with full persistence.
- **⌨️ Remote & Keyboard Hotkeys**: Press `9` for instant Search, press `0` for Filter drawer toggles.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: React Native / Expo (v57) with TypeScript
- **Styling**: Custom Design System with Theme Palette Tokens (`src/styles/theme.ts`)
- **State & Storage**: React Hooks & `@react-native-async-storage/async-storage`
- **Data Stream Integration**: Live IPTV API endpoints (`channels.json`, `streams.json`, M3U index maps)

---

## 📋 Requirements & Dependencies

Refer to `requirements.txt` for full dependencies:

- **Node.js**: `>= 18.0.0`
- **Expo**: `~57.0.16`
- **React**: `19.2.3`
- **React Native**: `0.86.2`

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Application
- **Web (Browser)**:
  ```bash
  npm run web
  ```
- **Expo Dev Server**:
  ```bash
  npm start
  ```
- **Android Device / Emulator**:
  ```bash
  npm run android
  ```

---

## 📄 License
Private & Proprietary - Built for Naitik's OTT Platform.
