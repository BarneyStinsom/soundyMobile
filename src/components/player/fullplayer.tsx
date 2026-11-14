// src/components/player/fullplayer.tsx
import PlayerControls from '@/components/player/PlayerControls';
import { getSongArtist, getSongCover, Song, usePlayer } from '@/contexts/playerContext';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface FullPlayerProps {
  songId?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function FullPlayer({ songId }: FullPlayerProps) {
  const router = useRouter();
  const { currentSong, position, duration, seekTo, playSong } = usePlayer();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Se a página do player for aberta diretamente via ID de URL diferente do currentSong
  useEffect(() => {
    async function loadSongDetails() {
      if (!songId) return;
      // Se a música atual já é a informada no ID, não precisa buscar novamente
      if (currentSong && (currentSong.id === songId || currentSong.songId === songId)) {
        return;
      }
      try {
        setLoading(true);
        const data = await api<Song>(`/songs/${songId}`);
        if (data) {
          playSong(data);
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes da música:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSongDetails();
  }, [songId]);

  const activeSong = currentSong;
  const cover = activeSong ? getSongCover(activeSong) : null;
  const artist = activeSong ? getSongArtist(activeSong) : '';
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e04bc0" />
      </SafeAreaView>
    );
  }

  if (!activeSong) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyText}>Nenhuma música selecionada</Text>
        <Pressable onPress={() => router.back()} style={styles.backButtonSimple}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color="#ffffff" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>TOCANDO DA SUA BIBLIOTECA</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Soundy Player
          </Text>
        </View>
        <Pressable style={styles.headerBtn} hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {/* Album Cover Section */}
      <View style={styles.artworkContainer}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.artwork} resizeMode="cover" />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <Ionicons name="musical-notes" size={100} color="#e04bc0" />
          </View>
        )}
      </View>

      {/* Track Info Section */}
      <View style={styles.infoRow}>
        <View style={styles.trackDetails}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {activeSong.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {artist}
          </Text>
        </View>
        <Pressable onPress={() => setIsLiked(!isLiked)} style={styles.heartBtn} hitSlop={10}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? '#e04bc0' : '#ffffff'}
          />
        </Pressable>
      </View>

      {/* Progress Bar Section */}
      <View style={styles.progressContainer}>
        <Pressable
          style={styles.progressBarTouchArea}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            // aproximação de seek ao clicar na barra
            const barWidth = 320; // largura estimada
            const ratio = Math.max(0, Math.min(1, locationX / barWidth));
            seekTo(ratio * duration);
          }}
        >
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            <View style={[styles.progressKnob, { left: `${progressPercent}%` }]} />
          </View>
        </Pressable>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        <PlayerControls size="large" color="#ffffff" />
      </View>

      {/* Bottom Actions Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.footerBtn}>
          <Ionicons name="tv-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
        </Pressable>
        <Pressable style={styles.footerBtn}>
          <Ionicons name="list" size={22} color="rgba(255, 255, 255, 0.6)" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12020d',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#12020d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 16,
  },
  backButtonSimple: {
    backgroundColor: '#e04bc0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  artwork: {
    width: 300,
    height: 300,
    borderRadius: 16,
    shadowColor: '#e04bc0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  artworkPlaceholder: {
    backgroundColor: '#270822',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224, 75, 192, 0.3)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  trackDetails: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  trackArtist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 4,
  },
  heartBtn: {
    padding: 4,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBarTouchArea: {
    paddingVertical: 8,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e04bc0',
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  controlsSection: {
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  footerBtn: {
    padding: 8,
  },
});
