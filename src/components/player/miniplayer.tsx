// src/components/player/miniplayer.tsx
import { getSongArtist, getSongCover, getSongId, usePlayer } from '@/contexts/playerContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function MiniPlayer({ bottom }: { bottom?: number }) {
  const { currentSong, isPlaying, togglePlay, nextSong, previousSong, position, duration, closePlayer } = usePlayer();
  const router = useRouter();

  if (!currentSong) return null;

  const songId = getSongId(currentSong);
  const cover = getSongCover(currentSong);
  const artist = getSongArtist(currentSong);
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleOpenFullPlayer = () => {
    if (songId) {
      router.push({ pathname: '/player/[id]', params: { id: songId } });
    }
  };

  return (
    <View style={[styles.outerContainer, bottom !== undefined && { bottom }]}>
      <Pressable onPress={handleOpenFullPlayer} style={styles.card}>
        {/* Barra de progresso discreta no topo do mini player */}
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.content}>
          {/* Capa do álbum */}
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="musical-note" size={20} color="#e04bc0" />
            </View>
          )}

          {/* Info da Música */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {artist}
            </Text>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actions}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                  previousSong();
                  }}
                  style={styles.actionBtn}
                  hitSlop={8}
                  >
  <Ionicons name="play-skip-back" size={20} color="#fff" />
</Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              style={styles.actionBtn}
              hitSlop={8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#ffffff"
              />
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                nextSong();
              }}
              style={styles.actionBtn}
              hitSlop={8}
            >
              <Ionicons name="play-skip-forward" size={20} color="#fff" />
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                closePlayer();
              }}
              style={styles.actionBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
    
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 50,
    left: 8,
    right: 8,
    zIndex: 999,
  },
  card: {
    backgroundColor: 'transparent',
    backdropFilter: 'blur(5px)', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    shadowColor: '#e04bc0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  coverPlaceholder: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224, 75, 192, 0.2)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 4,
  },
});
