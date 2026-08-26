import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import Hls from 'hls.js';
import { Channel, VideoQualityLevel } from '../types';
import { theme } from '../styles/theme';

export type ScreenFitMode = 'cover' | 'contain' | 'fill' | '16:9' | '4:3';

interface TVPlayerProps {
  channel: Channel | null;
  onClosePlayer?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
}

export const TVPlayer: React.FC<TVPlayerProps> = ({
  channel,
  onClosePlayer,
  onNextChannel,
  onPrevChannel,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<VideoQualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
  const [activePanel, setActivePanel] = useState<'none' | 'fit' | 'quality'>('none');
  const [fitMode, setFitMode] = useState<ScreenFitMode>('cover'); // Default: Cut-to-Cut edge-to-edge fill!
  const [fastStreamMode, setFastStreamMode] = useState(true); // Low Internet optimization
  const [fitToast, setFitToast] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls after 4 seconds
  const triggerControlsOverlay = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (activePanel === 'none') {
        setShowControls(false);
      }
    }, 4000);
  };

  useEffect(() => {
    triggerControlsOverlay();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [activePanel]);

  // expo-video player for native mobile (Android / iOS)
  const nativePlayer = useVideoPlayer(channel?.url || '', (player) => {
    if (channel?.url) {
      player.loop = true;
      player.play();
    }
  });

  useEffect(() => {
    if (!channel) return;

    setLoading(true);
    setError(null);
    setQualityLevels([]);
    setSelectedQuality(-1);
    setActivePanel('none');
    retryCountRef.current = 0;

    if (Platform.OS === 'web') {
      let hls: Hls | null = null;
      const videoEl = webVideoRef.current;

      if (videoEl) {
        videoEl.muted = isMuted;

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: fastStreamMode ? 10 : 30,
            maxMaxBufferLength: fastStreamMode ? 20 : 60,
            maxBufferSize: 30 * 1024 * 1024,
            backBufferLength: 10,
          });

          hlsRef.current = hls;

          hls.loadSource(channel.url);
          hls.attachMedia(videoEl);

          hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
            setLoading(false);

            videoEl.play().catch(() => {
              videoEl.muted = true;
              setIsMuted(true);
              videoEl.play().catch(() => {});
            });

            if (data.levels && data.levels.length > 0) {
              const parsedLevels: VideoQualityLevel[] = data.levels.map((lvl, index) => {
                const label = lvl.height ? `${lvl.height}p` : `Level ${index + 1}`;
                return {
                  index,
                  height: lvl.height || 0,
                  width: lvl.width || 0,
                  bitrate: lvl.bitrate,
                  label,
                };
              });

              parsedLevels.sort((a, b) => b.height - a.height);
              setQualityLevels(parsedLevels);
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              if (retryCountRef.current < 2) {
                retryCountRef.current += 1;
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls?.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls?.recoverMediaError();
                    break;
                  default:
                    hls?.destroy();
                    setError('Stream temporarily offline or CORS restricted.');
                    setLoading(false);
                    break;
                }
              } else {
                setError('Stream temporarily offline or CORS restricted.');
                setLoading(false);
                hls?.destroy();
              }
            }
          });
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          videoEl.src = channel.url;
          videoEl.addEventListener('loadedmetadata', () => {
            setLoading(false);
            videoEl.play().catch(() => {
              videoEl.muted = true;
              setIsMuted(true);
              videoEl.play().catch(() => {});
            });
          });
          videoEl.addEventListener('error', () => {
            setError('Failed to play stream.');
            setLoading(false);
          });
        } else {
          setError('HLS streaming is not supported on this browser.');
          setLoading(false);
        }
      }

      return () => {
        if (hls) hls.destroy();
        hlsRef.current = null;
      };
    } else {
      if (nativePlayer) {
        let isMounted = true;
        nativePlayer
          .replaceAsync(channel.url)
          .then(() => {
            if (isMounted) {
              nativePlayer.play();
              setLoading(false);
            }
          })
          .catch((err) => {
            if (isMounted) {
              console.warn('Failed to switch native channel stream:', err);
              setLoading(false);
            }
          });

        return () => {
          isMounted = false;
        };
      }
    }
  }, [channel, fastStreamMode, nativePlayer]);

  if (!channel) return null;

  const togglePlayPause = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (Platform.OS === 'web' && webVideoRef.current) {
      if (nextPlaying) webVideoRef.current.play();
      else webVideoRef.current.pause();
    } else if (nativePlayer) {
      if (nextPlaying) nativePlayer.play();
      else nativePlayer.pause();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = nextMuted;
    } else if (nativePlayer) {
      nativePlayer.muted = nextMuted;
    }
  };

  // Direct 1-Tap Cut-to-Cut Fit Video Aspect Ratio Cycler
  const handleCutToCutFitToggle = () => {
    let nextMode: ScreenFitMode = 'cover';
    let toastLabel = 'Cut-to-Cut ✂️ (Edge-to-Edge)';

    if (fitMode === 'cover') {
      nextMode = 'contain';
      toastLabel = 'Fit Screen 📺 (Standard Ratio)';
    } else if (fitMode === 'contain') {
      nextMode = 'fill';
      toastLabel = 'Stretch Full 📐 (100% Stretch)';
    } else {
      nextMode = 'cover';
      toastLabel = 'Cut-to-Cut ✂️ (Edge-to-Edge)';
    }

    setFitMode(nextMode);
    setFitToast(toastLabel);
    triggerControlsOverlay();
    setTimeout(() => setFitToast(null), 2500);
  };

  const changeQualityLevel = (levelIndex: number) => {
    setSelectedQuality(levelIndex);
    setActivePanel('none');

    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const getCurrentQualityLabel = () => {
    if (selectedQuality === -1) return 'Auto';
    const found = qualityLevels.find((q) => q.index === selectedQuality);
    return found ? found.label : 'Auto';
  };

  const getFitModeLabel = (mode: ScreenFitMode) => {
    switch (mode) {
      case 'cover':
        return 'Cut-to-Cut ✂️';
      case 'contain':
        return 'Fit Screen 📺';
      case 'fill':
        return 'Stretch Full 📐';
      case '16:9':
        return '16:9 Ratio 🎞️';
      case '4:3':
        return '4:3 Ratio 📽️';
      default:
        return 'Cut-to-Cut ✂️';
    }
  };

  // Compute CSS objectFit style for web video element
  const getWebObjectFitStyle = (): React.CSSProperties => {
    switch (fitMode) {
      case 'cover':
        return { objectFit: 'cover', width: '100%', height: '100%' };
      case 'contain':
        return { objectFit: 'contain', width: '100%', height: '100%' };
      case 'fill':
        return { objectFit: 'fill', width: '100%', height: '100%' };
      case '16:9':
        return { objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '16/9' };
      case '4:3':
        return { objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '4/3' };
      default:
        return { objectFit: 'cover', width: '100%', height: '100%' };
    }
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* Clean Compact Top Header */}
      {showControls && (
        <View style={styles.headerOverlay}>
          {onClosePlayer && (
            <TouchableOpacity style={styles.backBtnSmall} onPress={onClosePlayer} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={16} color="#FFF" />
              <Text style={styles.backBtnTextSmall}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.channelInfoCompact}>
            <View style={styles.liveBadgeSmall}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeTextSmall}>LIVE</Text>
            </View>
            <Text style={styles.channelNameCompact} numberOfLines={1}>
              {channel.name}
            </Text>
          </View>

          <TouchableOpacity style={styles.muteBtnSmall} onPress={toggleMute} activeOpacity={0.7}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Video View Wrapper */}
      <TouchableOpacity
        style={styles.videoWrapper}
        activeOpacity={1}
        onPress={triggerControlsOverlay}
      >
        {Platform.OS === 'web' ? (
          <video
            ref={webVideoRef}
            controls={false}
            autoPlay
            style={{
              backgroundColor: '#000',
              ...getWebObjectFitStyle(),
            }}
          />
        ) : (
          <VideoView
            player={nativePlayer}
            style={styles.nativeVideo}
            contentFit={fitMode === 'cover' ? 'cover' : fitMode === 'fill' ? 'fill' : 'contain'}
          />
        )}

        {/* Floating Toast Notification for Cut-to-Cut Fit Change */}
        {fitToast && (
          <View style={styles.toastBadge}>
            <Ionicons name="scan-sharp" size={18} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.toastText}>{fitToast}</Text>
          </View>
        )}

        {/* Center Playback Overlay (Seek 5s Back, Play/Pause, Seek 15s Forward) */}
        {showControls && !loading && !error && (
          <View style={styles.centerPlaybackControls}>
            <TouchableOpacity
              style={styles.seekCircleBtn}
              onPress={() => triggerControlsOverlay()}
              activeOpacity={0.7}
            >
              <Ionicons name="play-back" size={22} color="#FFF" />
              <Text style={styles.seekBtnText}>5s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainPlayPauseCircleBtn}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.seekCircleBtn}
              onPress={() => triggerControlsOverlay()}
              activeOpacity={0.7}
            >
              <Ionicons name="play-forward" size={22} color="#FFF" />
              <Text style={styles.seekBtnText}>15s</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Spinner Overlay */}
        {loading && !error && (
          <View style={styles.statusOverlay}>
            <ActivityIndicator size="large" color={theme.colors.accentLight} />
            <Text style={styles.statusText}>Connecting to Broadcast...</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.statusOverlay}>
            <Ionicons name="warning-outline" size={42} color={theme.colors.warning} />
            <Text style={styles.errorTitle}>Stream Connection Failed</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <View style={styles.errorActions}>
              {onNextChannel && (
                <TouchableOpacity style={styles.retryBtn} onPress={onNextChannel}>
                  <Text style={styles.retryBtnText}>Try Next Channel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Slide-Up Panel 1: Screen Fit / Cut-to-Cut Options */}
      {activePanel === 'fit' && (
        <View style={styles.slidePanelContainer}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>✂️ Screen Fit & Cut-to-Cut Adjust</Text>
            <TouchableOpacity onPress={() => setActivePanel('none')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.panelOptionsRow}>
            <TouchableOpacity
              style={[styles.panelOptionChip, fitMode === 'cover' && styles.panelOptionChipActive]}
              onPress={() => {
                setFitMode('cover');
                setActivePanel('none');
                setFitToast('Cut-to-Cut ✂️ (Edge-to-Edge)');
                setTimeout(() => setFitToast(null), 2000);
              }}
            >
              <Text style={[styles.panelOptionText, fitMode === 'cover' && styles.panelOptionTextActive]}>
                Cut-to-Cut Edge ✂️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.panelOptionChip, fitMode === 'contain' && styles.panelOptionChipActive]}
              onPress={() => {
                setFitMode('contain');
                setActivePanel('none');
                setFitToast('Fit Screen 📺');
                setTimeout(() => setFitToast(null), 2000);
              }}
            >
              <Text style={[styles.panelOptionText, fitMode === 'contain' && styles.panelOptionTextActive]}>
                Fit Screen 📺
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.panelOptionChip, fitMode === 'fill' && styles.panelOptionChipActive]}
              onPress={() => {
                setFitMode('fill');
                setActivePanel('none');
                setFitToast('Stretch Full 📐');
                setTimeout(() => setFitToast(null), 2000);
              }}
            >
              <Text style={[styles.panelOptionText, fitMode === 'fill' && styles.panelOptionTextActive]}>
                Stretch Full 📐
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.panelOptionChip, fitMode === '16:9' && styles.panelOptionChipActive]}
              onPress={() => {
                setFitMode('16:9');
                setActivePanel('none');
                setFitToast('16:9 Ratio 🎞️');
                setTimeout(() => setFitToast(null), 2000);
              }}
            >
              <Text style={[styles.panelOptionText, fitMode === '16:9' && styles.panelOptionTextActive]}>
                16:9 Ratio 🎞️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.panelOptionChip, fitMode === '4:3' && styles.panelOptionChipActive]}
              onPress={() => {
                setFitMode('4:3');
                setActivePanel('none');
                setFitToast('4:3 TV 📽️');
                setTimeout(() => setFitToast(null), 2000);
              }}
            >
              <Text style={[styles.panelOptionText, fitMode === '4:3' && styles.panelOptionTextActive]}>
                4:3 TV 📽️
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Slide-Up Panel 2: Picture Quality & Stream Settings Options */}
      {activePanel === 'quality' && (
        <View style={styles.slidePanelContainer}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>⚙️ Stream & Quality Settings</Text>
            <TouchableOpacity onPress={() => setActivePanel('none')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.panelOptionsRow}>
            <TouchableOpacity
              style={[styles.panelOptionChip, selectedQuality === -1 && styles.panelOptionChipActive]}
              onPress={() => changeQualityLevel(-1)}
            >
              <Text style={[styles.panelOptionText, selectedQuality === -1 && styles.panelOptionTextActive]}>
                Auto (Low Internet Buffer)
              </Text>
            </TouchableOpacity>

            {qualityLevels.length > 0
              ? qualityLevels.map((lvl) => {
                  const isSelected = selectedQuality === lvl.index;
                  return (
                    <TouchableOpacity
                      key={lvl.index}
                      style={[styles.panelOptionChip, isSelected && styles.panelOptionChipActive]}
                      onPress={() => changeQualityLevel(lvl.index)}
                    >
                      <Text style={[styles.panelOptionText, isSelected && styles.panelOptionTextActive]}>
                        {lvl.label} {lvl.height >= 720 ? '⭐' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : ['1080p HD', '720p HD', '480p SD', '360p Low'].map((res, i) => (
                  <TouchableOpacity
                    key={res}
                    style={styles.panelOptionChip}
                    onPress={() => changeQualityLevel(i)}
                  >
                    <Text style={styles.panelOptionText}>{res}</Text>
                  </TouchableOpacity>
                ))}
          </View>

          {/* Quick Settings Row */}
          <View style={styles.quickSettingsSubRow}>
            <TouchableOpacity
              style={[styles.quickSettingBtn, fastStreamMode && styles.quickSettingBtnActive]}
              onPress={() => setFastStreamMode(!fastStreamMode)}
            >
              <Ionicons name="flash" size={14} color={fastStreamMode ? '#F59E0B' : '#FFF'} style={{ marginRight: 4 }} />
              <Text style={[styles.quickSettingText, fastStreamMode && { color: '#F59E0B' }]}>
                Fast Mode ({fastStreamMode ? 'ON' : 'OFF'})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickSettingBtn}
              onPress={toggleMute}
            >
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.quickSettingText}>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Control Bar Overlay (Matching Screenshot Specs) */}
      {showControls && (
        <View style={styles.bottomToolbar}>
          {/* Previous Channel */}
          <TouchableOpacity
            style={[styles.navChannelBtn, !onPrevChannel && styles.btnDisabled]}
            onPress={onPrevChannel}
            disabled={!onPrevChannel}
          >
            <Ionicons name="play-skip-back" size={16} color="#FFF" />
          </TouchableOpacity>

          {/* Stream Time / Live Badge */}
          <View style={styles.streamTimeDisplay}>
            <View style={styles.redLiveDot} />
            <Text style={styles.streamTimeText}>LIVE Broadcast</Text>
          </View>

          {/* Right Action Icons Group (Settings ⚙️, Cut-to-Cut Fit ✂️, Fullscreen ⛶) */}
          <View style={styles.rightControlActionGroup}>
            {/* 1. Settings ⚙️ Icon Button */}
            <TouchableOpacity
              style={[styles.iconActionBtn, activePanel === 'quality' && styles.iconActionBtnActive]}
              onPress={() => setActivePanel(activePanel === 'quality' ? 'none' : 'quality')}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-sharp" size={19} color={activePanel === 'quality' ? theme.colors.accentLight : '#FFF'} />
            </TouchableOpacity>

            {/* 2. Direct Cut-to-Cut Fit ✂️ Icon Button */}
            <TouchableOpacity
              style={[styles.iconActionBtn, fitMode === 'cover' && styles.iconActionBtnActive]}
              onPress={handleCutToCutFitToggle}
              activeOpacity={0.7}
            >
              <Ionicons name="scan-sharp" size={19} color={fitMode === 'cover' ? '#10B981' : '#FFF'} />
            </TouchableOpacity>

            {/* 3. Fullscreen ⛶ Icon Button */}
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => setIsFullscreen(!isFullscreen)}
              activeOpacity={0.7}
            >
              <Ionicons name={isFullscreen ? 'contract-sharp' : 'expand-sharp'} size={19} color="#FFF" />
            </TouchableOpacity>

            {/* Next Channel */}
            <TouchableOpacity
              style={[styles.navChannelBtn, !onNextChannel && styles.btnDisabled, { marginLeft: 6 }]}
              onPress={onNextChannel}
              disabled={!onNextChannel}
            >
              <Ionicons name="play-skip-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  backBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  backBtnTextSmall: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  channelInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginRight: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFF',
    marginRight: 3,
  },
  liveBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  channelNameCompact: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  muteBtnSmall: {
    padding: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  videoWrapper: {
    flex: 1,
    width: '100%',
    minHeight: 320,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statusText: {
    marginTop: 12,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 10,
  },
  errorSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  errorActions: {
    marginTop: 14,
  },
  retryBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  slidePanelContainer: {
    position: 'absolute',
    bottom: 60,
    left: 8,
    right: 8,
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: theme.colors.accentLight,
    zIndex: 100,
    ...Platform.select({
      web: {
        boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  panelOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  panelOptionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 6,
    marginBottom: 6,
  },
  panelOptionChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accentLight,
  },
  panelOptionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  panelOptionTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  centerSlideActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  slideActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: 3,
  },
  slideActionBtnActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accentLight,
  },
  fastModeBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  slideActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  slideActionTextActive: {
    color: '#FFF',
  },
  fastModeTextActive: {
    color: '#F59E0B',
  },
  navChannelBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderRadius: 0,
    borderWidth: 0,
  },
  toastBadge: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: '#10B981',
    zIndex: 100,
  },
  toastText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerPlaybackControls: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  seekCircleBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  seekBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
  mainPlayPauseCircleBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickSettingsSubRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickSettingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
  },
  quickSettingBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  quickSettingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  streamTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  redLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  streamTimeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  rightControlActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActionBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 4,
  },
  iconActionBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});
