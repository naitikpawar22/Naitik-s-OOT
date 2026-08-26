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
  const [qualityLevels, setQualityLevels] = useState<VideoQualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
  const [activePanel, setActivePanel] = useState<'none' | 'fit' | 'quality' | 'settings'>('none');
  const [fitMode, setFitMode] = useState<ScreenFitMode>('cover'); // Default: Cut-to-Cut edge-to-edge fill!
  const [fastStreamMode, setFastStreamMode] = useState(true); // Low Internet optimization

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [focusedControl, setFocusedControl] = useState<string | null>(null);

  const containerRef = useRef<View>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef<number>(0);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // expo-video player for native mobile (Android / iOS)
  const nativePlayer = useVideoPlayer(channel?.url || '', (player) => {
    if (channel?.url) {
      player.loop = true;
      player.play();
    }
  });

  // Auto-hide overlay controls after 4 seconds of inactivity
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (activePanel === 'none') {
        setShowControls(false);
      }
    }, 4500);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [activePanel]);

  useEffect(() => {
    if (!channel) return;

    setLoading(true);
    setError(null);
    setQualityLevels([]);
    setSelectedQuality(-1);
    setActivePanel('none');
    setIsPlaying(true);
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

            videoEl.play().then(() => setIsPlaying(true)).catch(() => {
              videoEl.muted = true;
              setIsMuted(true);
              videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
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
            videoEl.play().then(() => setIsPlaying(true)).catch(() => {
              videoEl.muted = true;
              setIsMuted(true);
              videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
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
              setIsPlaying(true);
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
    resetControlsTimeout();
    if (isPlaying) {
      if (Platform.OS === 'web' && webVideoRef.current) {
        webVideoRef.current.pause();
      } else if (nativePlayer) {
        nativePlayer.pause();
      }
      setIsPlaying(false);
    } else {
      if (Platform.OS === 'web' && webVideoRef.current) {
        webVideoRef.current.play();
      } else if (nativePlayer) {
        nativePlayer.play();
      }
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    resetControlsTimeout();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = nextMuted;
    } else if (nativePlayer) {
      nativePlayer.muted = nextMuted;
    }
  };

  const toggleFullscreen = () => {
    resetControlsTimeout();
    if (Platform.OS === 'web') {
      if (!document.fullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } else {
      setIsFullscreen(!isFullscreen);
    }
  };

  const changeQualityLevel = (levelIndex: number) => {
    resetControlsTimeout();
    setSelectedQuality(levelIndex);
    setActivePanel('none');

    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const cycleFitMode = () => {
    resetControlsTimeout();
    const modes: ScreenFitMode[] = ['contain', 'cover', 'fill', '16:9', '4:3'];
    const currentIndex = modes.indexOf(fitMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setFitMode(nextMode);
  };

  const getCurrentQualityLabel = () => {
    if (selectedQuality === -1) return 'Auto';
    const found = qualityLevels.find((q) => q.index === selectedQuality);
    return found ? found.label : 'Auto';
  };

  const getFitModeLabel = (mode: ScreenFitMode) => {
    switch (mode) {
      case 'contain':
        return 'Fit 📺';
      case 'cover':
        return 'Cut-to-Cut ✂️';
      case 'fill':
        return 'Stretch 📐';
      case '16:9':
        return '16:9 🎞️';
      case '4:3':
        return '4:3 📽️';
      default:
        return 'Fit 📺';
    }
  };

  // Compute CSS objectFit style for web video element
  const getWebObjectFitStyle = (): React.CSSProperties => {
    switch (fitMode) {
      case 'contain':
        return { objectFit: 'contain', width: '100%', height: '100%' };
      case 'cover':
        return { objectFit: 'cover', width: '100%', height: '100%' };
      case 'fill':
        return { objectFit: 'fill', width: '100%', height: '100%' };
      case '16:9':
        return { objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '16/9' };
      case '4:3':
        return { objectFit: 'contain', width: '100%', height: 'auto', aspectRatio: '4/3' };
      default:
        return { objectFit: 'contain', width: '100%', height: '100%' };
    }
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, isFullscreen && styles.fullscreenContainer]}
      onTouchStart={resetControlsTimeout}
    >
      {/* Video View Wrapper */}
      <View style={styles.videoWrapper}>
        {Platform.OS === 'web' ? (
          <video
            ref={webVideoRef}
            autoPlay
            playsInline
            style={{
              backgroundColor: '#000',
              ...getWebObjectFitStyle(),
            }}
            onClick={resetControlsTimeout}
          />
        ) : (
          <VideoView
            player={nativePlayer}
            style={styles.nativeVideo}
            contentFit={fitMode === 'cover' ? 'cover' : fitMode === 'fill' ? 'fill' : 'contain'}
          />
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
                <TouchableOpacity
                  style={[styles.retryBtn, focusedControl === 'retry' && styles.focusedBtn]}
                  onPress={onNextChannel}
                  onFocus={() => setFocusedControl('retry')}
                  onBlur={() => setFocusedControl(null)}
                >
                  <Text style={styles.retryBtnText}>Try Next Channel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* YouTube-Style Controls Overlay */}
        {(showControls || activePanel !== 'none') && (
          <View style={styles.controlsOverlay}>
            {/* Top Header Controls Bar */}
            <View style={styles.topHeaderBar}>
              <View style={styles.topLeftGroup}>
                {onClosePlayer && (
                  <TouchableOpacity
                    style={[styles.backBtnSmall, focusedControl === 'back' && styles.focusedBtn]}
                    onPress={onClosePlayer}
                    onFocus={() => {
                      resetControlsTimeout();
                      setFocusedControl('back');
                    }}
                    onBlur={() => setFocusedControl(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={18} color="#FFF" />
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
              </View>

              <View style={styles.topRightGroup}>
                {/* Settings Gear Button (YouTube Style) */}
                <TouchableOpacity
                  style={[styles.topControlBtn, focusedControl === 'settings' && styles.focusedBtn, activePanel !== 'none' && styles.topControlBtnActive]}
                  onPress={() => {
                    resetControlsTimeout();
                    setActivePanel(activePanel === 'settings' ? 'none' : 'settings');
                  }}
                  onFocus={() => {
                    resetControlsTimeout();
                    setFocusedControl('settings');
                  }}
                  onBlur={() => setFocusedControl(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="settings-sharp" size={20} color="#FFF" />
                </TouchableOpacity>

                {/* Volume / Mute Button */}
                <TouchableOpacity
                  style={[styles.topControlBtn, focusedControl === 'mute' && styles.focusedBtn]}
                  onPress={toggleMute}
                  onFocus={() => {
                    resetControlsTimeout();
                    setFocusedControl('mute');
                  }}
                  onBlur={() => setFocusedControl(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Playback Controls (Previous, Large Play/Pause, Next) */}
            <View style={styles.centerControlsRow}>
              <TouchableOpacity
                style={[styles.centerNavBtn, !onPrevChannel && styles.btnDisabled, focusedControl === 'prev' && styles.focusedBtn]}
                onPress={onPrevChannel}
                disabled={!onPrevChannel}
                onFocus={() => {
                  resetControlsTimeout();
                  setFocusedControl('prev');
                }}
                onBlur={() => setFocusedControl(null)}
              >
                <Ionicons name="play-skip-back" size={26} color="#FFF" />
              </TouchableOpacity>

              {/* Large Center YouTube Play / Pause Toggle */}
              <TouchableOpacity
                style={[styles.largePlayPauseBtn, focusedControl === 'playpause' && styles.focusedBtn]}
                onPress={togglePlayPause}
                onFocus={() => {
                  resetControlsTimeout();
                  setFocusedControl('playpause');
                }}
                onBlur={() => setFocusedControl(null)}
                activeOpacity={0.85}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={38} color="#FFF" style={{ marginLeft: isPlaying ? 0 : 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.centerNavBtn, !onNextChannel && styles.btnDisabled, focusedControl === 'next' && styles.focusedBtn]}
                onPress={onNextChannel}
                disabled={!onNextChannel}
                onFocus={() => {
                  resetControlsTimeout();
                  setFocusedControl('next');
                }}
                onBlur={() => setFocusedControl(null)}
              >
                <Ionicons name="play-skip-forward" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls Bar (Screen Fit, Quality Pill & Bottom-Right Fullscreen Button) */}
            <View style={styles.bottomControlsBar}>
              <View style={styles.bottomLeftControls}>
                {/* Cut-to-Cut & Screen Fit Toggle */}
                <TouchableOpacity
                  style={[styles.bottomPillBtn, focusedControl === 'fit' && styles.focusedBtn]}
                  onPress={cycleFitMode}
                  onFocus={() => {
                    resetControlsTimeout();
                    setFocusedControl('fit');
                  }}
                  onBlur={() => setFocusedControl(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan-outline" size={15} color="#10B981" />
                  <Text style={styles.bottomPillText}>{getFitModeLabel(fitMode)}</Text>
                </TouchableOpacity>

                {/* Quality Pill Button */}
                <TouchableOpacity
                  style={[styles.bottomPillBtn, focusedControl === 'quality' && styles.focusedBtn]}
                  onPress={() => {
                    resetControlsTimeout();
                    setActivePanel(activePanel === 'quality' ? 'none' : 'quality');
                  }}
                  onFocus={() => {
                    resetControlsTimeout();
                    setFocusedControl('quality');
                  }}
                  onBlur={() => setFocusedControl(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="options-outline" size={15} color={theme.colors.accentLight} />
                  <Text style={styles.bottomPillText}>{getCurrentQualityLabel()}</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom-Right Corner Fullscreen Button */}
              <TouchableOpacity
                style={[styles.fullscreenBtn, focusedControl === 'fullscreen' && styles.focusedBtn]}
                onPress={toggleFullscreen}
                onFocus={() => {
                  resetControlsTimeout();
                  setFocusedControl('fullscreen');
                }}
                onBlur={() => setFocusedControl(null)}
                activeOpacity={0.85}
              >
                <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* YouTube-Style Settings Modal Popover */}
        {activePanel !== 'none' && (
          <View style={styles.settingsModalOverlay}>
            <View style={styles.settingsModalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {activePanel === 'settings' ? '⚙️ Player Settings' : activePanel === 'quality' ? '⚙️ Video Quality' : '✂️ Screen Aspect Fit'}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setActivePanel('none')}
                >
                  <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Settings Panel Content */}
              {activePanel === 'settings' && (
                <View style={styles.modalSectionList}>
                  {/* Quality Row */}
                  <TouchableOpacity
                    style={styles.modalRowItem}
                    onPress={() => setActivePanel('quality')}
                  >
                    <View style={styles.modalRowLeft}>
                      <Ionicons name="bar-chart-outline" size={18} color={theme.colors.accentLight} />
                      <Text style={styles.modalRowLabel}>Quality</Text>
                    </View>
                    <View style={styles.modalRowRight}>
                      <Text style={styles.modalRowValue}>{getCurrentQualityLabel()}</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                    </View>
                  </TouchableOpacity>

                  {/* Screen Fit Row (Cut-to-Cut / Fit) */}
                  <TouchableOpacity
                    style={styles.modalRowItem}
                    onPress={() => setActivePanel('fit')}
                  >
                    <View style={styles.modalRowLeft}>
                      <Ionicons name="scan-outline" size={18} color="#10B981" />
                      <Text style={styles.modalRowLabel}>Screen Mode</Text>
                    </View>
                    <View style={styles.modalRowRight}>
                      <Text style={styles.modalRowValue}>{getFitModeLabel(fitMode)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                    </View>
                  </TouchableOpacity>

                  {/* Low Internet Fast Mode Row */}
                  <TouchableOpacity
                    style={styles.modalRowItem}
                    onPress={() => setFastStreamMode(!fastStreamMode)}
                  >
                    <View style={styles.modalRowLeft}>
                      <Ionicons name="flash" size={18} color={fastStreamMode ? '#F59E0B' : '#FFF'} />
                      <Text style={styles.modalRowLabel}>Fast Stream Mode</Text>
                    </View>
                    <View style={styles.modalRowRight}>
                      <Text style={[styles.modalRowValue, { color: fastStreamMode ? '#F59E0B' : '#94A3B8' }]}>
                        {fastStreamMode ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Quality Options Menu */}
              {activePanel === 'quality' && (
                <View style={styles.modalOptionsGrid}>
                  <TouchableOpacity
                    style={[styles.modalChip, selectedQuality === -1 && styles.modalChipActive]}
                    onPress={() => changeQualityLevel(-1)}
                  >
                    <Text style={[styles.modalChipText, selectedQuality === -1 && styles.modalChipTextActive]}>
                      Auto (Best Performance)
                    </Text>
                  </TouchableOpacity>

                  {qualityLevels.length > 0
                    ? qualityLevels.map((lvl) => {
                        const isSelected = selectedQuality === lvl.index;
                        return (
                          <TouchableOpacity
                            key={lvl.index}
                            style={[styles.modalChip, isSelected && styles.modalChipActive]}
                            onPress={() => changeQualityLevel(lvl.index)}
                          >
                            <Text style={[styles.modalChipText, isSelected && styles.modalChipTextActive]}>
                              {lvl.label} {lvl.height >= 720 ? '⭐ HD' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    : ['1080p Full HD', '720p HD', '480p SD', '360p Low'].map((res, i) => (
                        <TouchableOpacity
                          key={res}
                          style={styles.modalChip}
                          onPress={() => changeQualityLevel(i)}
                        >
                          <Text style={styles.modalChipText}>{res}</Text>
                        </TouchableOpacity>
                      ))}
                </View>
              )}

              {/* Screen Fit Options Menu (Cut-to-Cut, Contain, Fill, 16:9, 4:3) */}
              {activePanel === 'fit' && (
                <View style={styles.modalOptionsGrid}>
                  <TouchableOpacity
                    style={[styles.modalChip, fitMode === 'contain' && styles.modalChipActive]}
                    onPress={() => {
                      setFitMode('contain');
                      setActivePanel('none');
                    }}
                  >
                    <Text style={[styles.modalChipText, fitMode === 'contain' && styles.modalChipTextActive]}>
                      Fit Screen 📺 (Default)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalChip, fitMode === 'cover' && styles.modalChipActive]}
                    onPress={() => {
                      setFitMode('cover');
                      setActivePanel('none');
                    }}
                  >
                    <Text style={[styles.modalChipText, fitMode === 'cover' && styles.modalChipTextActive]}>
                      Cut-to-Cut Edge ✂️ (Crop Fill)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalChip, fitMode === 'fill' && styles.modalChipActive]}
                    onPress={() => {
                      setFitMode('fill');
                      setActivePanel('none');
                    }}
                  >
                    <Text style={[styles.modalChipText, fitMode === 'fill' && styles.modalChipTextActive]}>
                      Stretch Full 📐
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalChip, fitMode === '16:9' && styles.modalChipActive]}
                    onPress={() => {
                      setFitMode('16:9');
                      setActivePanel('none');
                    }}
                  >
                    <Text style={[styles.modalChipText, fitMode === '16:9' && styles.modalChipTextActive]}>
                      16:9 Widescreen Ratio 🎞️
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalChip, fitMode === '4:3' && styles.modalChipActive]}
                    onPress={() => {
                      setFitMode('4:3');
                      setActivePanel('none');
                    }}
                  >
                    <Text style={[styles.modalChipText, fitMode === '4:3' && styles.modalChipTextActive]}>
                      4:3 Standard TV 📽️
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
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
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
    borderRadius: 0,
    borderWidth: 0,
  },
  videoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    zIndex: 20,
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
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    zIndex: 30,
    padding: 12,
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginRight: 8,
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
  topControlBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginLeft: 8,
  },
  topControlBtnActive: {
    backgroundColor: theme.colors.accent,
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  centerNavBtn: {
    padding: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginHorizontal: 16,
  },
  largePlayPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  bottomLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomPillText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  fullscreenBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  focusedBtn: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    backgroundColor: theme.colors.accent,
  },
  settingsModalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    padding: 16,
  },
  settingsModalCard: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionList: {
    flexDirection: 'column',
  },
  modalRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  modalRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRowValue: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginRight: 4,
  },
  modalOptionsGrid: {
    flexDirection: 'column',
    marginTop: 4,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  modalChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accentLight,
  },
  modalChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
});
