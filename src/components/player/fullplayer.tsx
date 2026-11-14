// src/components/player/fullplayer.tsx
import PlayerControls from '@/components/player/PlayerControls';
import { useAuth } from '@/contexts/authcontext';
import { getSongArtist, getSongCover, getSongId, Song, usePlayer } from '@/contexts/playerContext';
import { buscarCurtida, curtir, descurtir } from '@/lib/curtidas';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Platform,
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
  const { user } = useAuth();

  // TODOS os hooks ficam aqui em cima, antes de qualquer "return" antecipado
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragRatio, setDragRatio] = useState<number | null>(null); // 0..1 enquanto arrasta
  const [salvandoCurtida, setSalvandoCurtida] = useState(false);
  const [erroCurtida, setErroCurtida] = useState('');
  const tocouCoracaoRef = useRef(false); // se a pessoa já mexeu no coração nesta música
  const songKey = currentSong ? getSongId(currentSong) : '';

  // refs: o PanResponder é criado uma vez só, então precisa ler valores sempre atuais daqui
  const barWidthRef = useRef(0);
  const startXRef = useRef(0);
  const durationRef = useRef(0);
  const seekRef = useRef(seekTo);
  durationRef.current = duration;
  seekRef.current = seekTo;

  const ratioFromX = (x: number) =>
    barWidthRef.current > 0 ? Math.max(0, Math.min(1, x / barWidthRef.current)) : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      // encosta na barra: já mostra a posição (serve também pro toque simples)
      onPanResponderGrant: (e) => {
        startXRef.current = e.nativeEvent.locationX;
        setDragRatio(ratioFromX(startXRef.current));
      },
      // arrastando: ponto inicial + deslocamento do dedo
      onPanResponderMove: (_e, g) => {
        setDragRatio(ratioFromX(startXRef.current + g.dx));
      },
      // soltou: só aqui pula a música pro ponto escolhido
      onPanResponderRelease: (_e, g) => {
        const r = ratioFromX(startXRef.current + g.dx);
        seekRef.current(r * durationRef.current);
        setDragRatio(null);
      },
      onPanResponderTerminate: () => setDragRatio(null),
    })
  ).current;

  // Ao trocar de música, confere se ela já está na playlist "Músicas curtidas"
  useEffect(() => {
    tocouCoracaoRef.current = false;
    setErroCurtida('');
    if (!user || !songKey) { setIsLiked(false); return; }
    let cancelado = false;
    buscarCurtida(user.id, songKey)
      .then((r) => {
        // se a pessoa já tocou no coração enquanto carregava, não desfaz o toque dela
        if (!cancelado && !tocouCoracaoRef.current) setIsLiked(!!r.itemId);
      })
      .catch((e) => console.warn('Erro ao checar curtida:', e));
    return () => { cancelado = true; };
  }, [user?.id, songKey]);

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

  // coração: adiciona/remove da playlist "Músicas curtidas"
  async function alternarCurtida() {
    if (!user) { setErroCurtida('Você precisa estar logado para curtir.'); return; }
    if (!songKey) { setErroCurtida('Não foi possível identificar a música.'); return; }
    if (salvandoCurtida) return;

    tocouCoracaoRef.current = true;
    const novo = !isLiked;
    setIsLiked(novo); // responde na hora; se der erro, desfaz
    setErroCurtida('');
    setSalvandoCurtida(true);
    try {
      const { playlistId, itemId } = await buscarCurtida(user.id, songKey);
      console.log('[curtir]', { novo, songKey, playlistId, itemId });
      if (novo && !itemId) await curtir(playlistId, songKey);
      if (!novo && itemId) await descurtir(itemId);
    } catch (e) {
      console.error('Erro ao curtir:', e);
      setErroCurtida(e instanceof Error ? e.message : 'Não foi possível curtir a música.');
      setIsLiked(!novo);
    } finally {
      setSalvandoCurtida(false);
    }
  }

  // volta se houver tela anterior; senão (ex.: página recarregada na web) vai pro início
  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const activeSong = currentSong;
  const cover = activeSong ? getSongCover(activeSong) : null;
  const artist = activeSong ? getSongArtist(activeSong) : '';
  const progressPercent =
    dragRatio !== null ? dragRatio * 100 : duration > 0 ? (position / duration) * 100 : 0;
  const shownPosition = dragRatio !== null ? dragRatio * duration : position;

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
        <Pressable onPress={voltar} style={styles.backButtonSimple}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={voltar} style={styles.headerBtn} hitSlop={12}>
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
        <Pressable onPress={alternarCurtida} style={styles.heartBtn} hitSlop={10}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? '#e04bc0' : '#ffffff'}
          />
        </Pressable>
      </View>

      {!!erroCurtida && <Text style={styles.erroCurtida}>{erroCurtida}</Text>}

      {/* Progress Bar Section */}
      <View style={styles.progressContainer}>
        <View
          style={styles.progressBarTouchArea}
          onLayout={(e) => { barWidthRef.current = e.nativeEvent.layout.width; }}
          {...panResponder.panHandlers}
        >
          {/* pointerEvents none: o toque é sempre lido na área da barra, não nos filhos */}
          <View style={styles.progressBarTrack} pointerEvents="none">
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            <View
              style={[
                styles.progressKnob,
                dragRatio !== null && styles.progressKnobActive,
                { left: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(shownPosition)}</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#12020d',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
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
  erroCurtida: {
    color: '#ff8a8a',
    fontSize: 13,
    marginTop: 6,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBarTouchArea: {
    paddingVertical: 16, // área de toque maior, fica mais fácil de pegar
    ...(Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none', cursor: 'pointer' } as any) : {}),
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
  progressKnobActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    top: -7,
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