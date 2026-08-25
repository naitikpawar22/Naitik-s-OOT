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
  const [activePanel, setActivePanel] = useState<'none' | 'fit' | 'quality'>('none');
  const [fitMode, setFitMode] = useState<ScreenFitMode>('cover'); // Default: Cut-to-Cut edge-to-edge fill!
  const [fastStreamMode, setFastStreamMode] = useState(true); // Low Internet optimization

  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef<number>(0);

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
        nativePlayer.replace(channel.url);
        nativePlayer.play();
        setLoading(false);
      }
    }
  }, [channel, fastStreamMode, nativePlayer]);

  if (!channel) return null;

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = nextMuted;
    } else if (nativePlayer) {
      nativePlayer.muted = nextMuted;
    }
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
    <View style={styles.container}>
      {/* Clean Compact Top Header */}
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

      {/* Video View Wrapper */}
      <View style={styles.videoWrapper}>
        {Platform.OS === 'web' ? (
          <video
            ref={webVideoRef}
            controls
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
      </View>

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
              }}
            >
              <Text style={[styles.panelOptionText, fitMode === '4:3' && styles.panelOptionTextActive]}>
                4:3 TV 📽️
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Slide-Up Panel 2: Picture Quality Options */}
      {activePanel === 'quality' && (
        <View style={styles.slidePanelContainer}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>⚙️ Select Video Resolution Quality</Text>
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
                Auto (Low Internet)
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
              : ['1080p', '720p', '480p', '360p'].map((res, i) => (
                  <TouchableOpacity
                    key={res}
                    style={styles.panelOptionChip}
                    onPress={() => changeQualityLevel(i)}
                  >
                    <Text style={styles.panelOptionText}>{res}</Text>
                  </TouchableOpacity>
                ))}
          </View>
        </View>
      )}

      {/* Bottom 3-Button Slide Toolbar */}
      <View style={styles.bottomToolbar}>
        {/* Previous Channel */}
        <TouchableOpacity
          style={[styles.navChannelBtn, !onPrevChannel && styles.btnDisabled]}
          onPress={onPrevChannel}
          disabled={!onPrevChannel}
        >
          <Ionicons name="play-skip-back" size={16} color="#FFF" />
        </TouchableOpacity>

        {/* 3 Main Sliding Control Panel Buttons */}
        <View style={styles.centerSlideActionGroup}>
          {/* Button 1: Cut-to-Cut Screen Fit Slide Panel */}
          <TouchableOpacity
            style={[styles.slideActionBtn, activePanel === 'fit' && styles.slideActionBtnActive]}
            onPress={() => setActivePanel(activePanel === 'fit' ? 'none' : 'fit')}
            activeOpacity={0.7}
          >
            <Ionicons name="scan-outline" size={15} color={activePanel === 'fit' ? '#FFF' : '#10B981'} />
            <Text style={[styles.slideActionText, activePanel === 'fit' && styles.slideActionTextActive]}>
              {getFitModeLabel(fitMode)}
            </Text>
          </TouchableOpacity>

          {/* Button 2: Stream Resolution Quality Slide Panel */}
          <TouchableOpacity
            style={[styles.slideActionBtn, activePanel === 'quality' && styles.slideActionBtnActive]}
            onPress={() => setActivePanel(activePanel === 'quality' ? 'none' : 'quality')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={15} color={activePanel === 'quality' ? '#FFF' : theme.colors.accentLight} />
            <Text style={[styles.slideActionText, activePanel === 'quality' && styles.slideActionTextActive]}>
              Quality ({getCurrentQualityLabel()})
            </Text>
          </TouchableOpacity>

          {/* Button 3: Low Internet Speed Fast Mode Toggle */}
          <TouchableOpacity
            style={[styles.slideActionBtn, fastStreamMode && styles.fastModeBtnActive]}
            onPress={() => setFastStreamMode(!fastStreamMode)}
            activeOpacity={0.7}
          >
            <Ionicons name="flash" size={15} color={fastStreamMode ? '#F59E0B' : '#FFF'} />
            <Text style={[styles.slideActionText, fastStreamMode && styles.fastModeTextActive]}>
              Fast Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Next Channel */}
        <TouchableOpacity
          style={[styles.navChannelBtn, !onNextChannel && styles.btnDisabled]}
          onPress={onNextChannel}
          disabled={!onNextChannel}
        >
          <Ionicons name="play-skip-forward" size={16} color="#FFF" />
        </TouchableOpacity>
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
});
