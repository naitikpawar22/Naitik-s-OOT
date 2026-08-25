import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import { theme } from '../styles/theme';

interface ChannelDetailModalProps {
  channel: Channel | null;
  visible: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const ChannelDetailModal: React.FC<ChannelDetailModalProps> = ({
  channel,
  visible,
  isFavorite,
  onClose,
  onPlay,
  onToggleFavorite,
}) => {
  if (!channel) return null;

  const copyToClipboard = () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(channel.url);
      alert('Stream URL copied to clipboard!');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle" size={26} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.header}>
            {channel.logo ? (
              <Image source={{ uri: channel.logo }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="tv" size={32} color={theme.colors.accentLight} />
              </View>
            )}

            <Text style={styles.channelName}>{channel.name}</Text>
            <View style={styles.tagRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{channel.category}</Text>
              </View>
              {channel.country && (
                <View style={[styles.badge, styles.badgeOutline]}>
                  <Text style={styles.badgeOutlineText}>{channel.country}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>TVG ID:</Text>
              <Text style={styles.infoValue}>{channel.tvgId || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stream URL:</Text>
              <TouchableOpacity style={styles.urlBox} onPress={copyToClipboard}>
                <Text style={styles.urlText} numberOfLines={1}>
                  {channel.url}
                </Text>
                <Ionicons name="copy-outline" size={14} color={theme.colors.accentLight} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.favBtn, isFavorite && styles.favBtnActive]}
              onPress={() => onToggleFavorite(channel.id)}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={isFavorite ? '#FFF' : theme.colors.secondary}
              />
              <Text style={[styles.favBtnText, isFavorite && styles.favBtnTextActive]}>
                {isFavorite ? 'Saved' : 'Favorite'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.playBtn]}
              onPress={() => {
                onPlay(channel);
                onClose();
              }}
            >
              <Ionicons name="play" size={18} color="#FFF" />
              <Text style={styles.playBtnText}>Watch Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: theme.spacing.sm,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  channelName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  badge: {
    backgroundColor: theme.colors.badgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.accentLight,
    fontWeight: '700',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeOutlineText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  infoSection: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm + 4,
    marginVertical: theme.spacing.md,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 6,
    borderRadius: theme.borderRadius.sm,
  },
  urlText: {
    fontSize: 12,
    color: theme.colors.accentLight,
    flex: 1,
    marginRight: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: 4,
  },
  favBtn: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  favBtnActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  favBtnText: {
    color: theme.colors.secondary,
    fontWeight: '700',
    marginLeft: 6,
  },
  favBtnTextActive: {
    color: '#FFF',
  },
  playBtn: {
    backgroundColor: theme.colors.accent,
  },
  playBtnText: {
    color: '#FFF',
    fontWeight: '700',
    marginLeft: 6,
  },
});
