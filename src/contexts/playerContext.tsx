// src/contexts/playerContext.tsx
import { api } from '@/services/api';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type Song = {
  id?: string;
  songId?: string;
  title: string;
  artistName?: string;
  artist?: { name: string };
  songCoverUrl?: string | null;
  coverUrl?: string | null;
  songUrl?: string;
  audioUrl?: string;
  duration?: number | string;
  playCount?: number;
  // outros nomes possíveis para o link do áudio, conforme o backend
  url?: string;
  fileUrl?: string;
  audio?: string;
  streamUrl?: string;
};

interface PlayerContextData {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Song[];
  currentIndex: number;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (seconds: number) => void;
  closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextData>({} as PlayerContextData);

export function parseDuration(duration?: number | string): number {
  if (!duration) return 180;
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    if (duration.includes(':')) {
      const parts = duration.split(':');
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    const num = parseInt(duration, 10);
    return isNaN(num) ? 180 : num;
  }
  return 180;
}

export const getSongId = (song: Song) => song.songId || song.id || '';
export const getSongCover = (song: Song) => song.songCoverUrl || song.coverUrl || null;
export const getSongArtist = (song: Song) => song.artistName || song.artist?.name || 'Artista desconhecido';
export const getSongUrl = (song: Song) =>
  song.songUrl || song.audioUrl || song.url || song.fileUrl || song.audio || song.streamUrl || '';

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const playerRef = useRef<AudioPlayer | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // refs espelham o estado: callbacks (timer, fim da música) não podem usar valores "velhos"
  const queueRef = useRef<Song[]>([]);
  const indexRef = useRef(0);
  const loadIdRef = useRef(0);

  useEffect(() => {
    setIsAudioActiveAsync(true).catch(() => {});
    // sem isso o iOS fica mudo com o botão de silencioso ligado
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    return () => {
      stopTracking();
      releasePlayer();
    };
  }, []);

  function stopTracking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startTracking() {
    stopTracking();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setPosition(p.currentTime || 0);
      if (p.duration > 0) setDuration(p.duration);
    }, 250);
  }

  function releasePlayer() {
    subRef.current?.remove();
    subRef.current = null;
    try {
      playerRef.current?.release();
    } catch {}
    playerRef.current = null;
  }

  // A lista "top" pode vir sem a URL do áudio: nesse caso busca os detalhes da música.
  async function resolveSong(song: Song): Promise<Song> {
    if (getSongUrl(song)) return song;
    const id = getSongId(song);
    if (!id) return song;
    try {
      const full = await api<Song>(`/songs/${id}`);
      return full ? { ...song, ...full } : song;
    } catch (e) {
      console.error('Erro ao buscar detalhes da música:', e);
      return song;
    }
  }

  async function loadAndPlay(song: Song) {
    const myLoad = ++loadIdRef.current;
    stopTracking();
    releasePlayer();

    const full = await resolveSong(song);
    if (myLoad !== loadIdRef.current) return; // outra música foi escolhida enquanto buscava
    setCurrentSong(full);

    const url = getSongUrl(full);
    if (!url) {
      console.error('Música sem URL de áudio. Campos recebidos:', Object.keys(full));
      setIsPlaying(false);
      return;
    }

    try {
      const player = createAudioPlayer({ uri: url });
      playerRef.current = player;
      subRef.current = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) nextSong();
        else setIsPlaying(!!status.playing);
      });
      setDuration(parseDuration(full.duration));
      player.play();
      setIsPlaying(true);
      startTracking();
    } catch (e) {
      console.error('Erro ao carregar áudio:', e);
      setIsPlaying(false);
    }
  }

  function playSong(song: Song, newQueue?: Song[]) {
    const list = newQueue && newQueue.length > 0 ? newQueue : [song];
    const idx = list.findIndex((s) => getSongId(s) === getSongId(song));
    queueRef.current = list;
    indexRef.current = idx !== -1 ? idx : 0;
    setQueue(list);
    setCurrentIndex(indexRef.current);
    setCurrentSong(song);
    setPosition(0);
    loadAndPlay(song);
  }

  function resume() {
    const p = playerRef.current;
    if (!p) return;
    p.play();
    setIsPlaying(true);
    startTracking();
  }

  function pause() {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
    setIsPlaying(false);
    stopTracking();
  }

  function togglePlay() {
    if (playerRef.current?.playing) pause();
    else resume();
  }

  function goTo(idx: number) {
    const song = queueRef.current[idx];
    if (!song) return;
    indexRef.current = idx;
    setCurrentIndex(idx);
    setCurrentSong(song);
    setPosition(0);
    loadAndPlay(song);
  }

  function nextSong() {
    const n = queueRef.current.length;
    if (n === 0) return;
    goTo((indexRef.current + 1) % n);
  }

  function previousSong() {
    const n = queueRef.current.length;
    if (n === 0) return;
    goTo((indexRef.current - 1 + n) % n);
  }

  async function seekTo(seconds: number) {
    if (!playerRef.current) return;
    await playerRef.current.seekTo(seconds);
    setPosition(seconds);
  }

  function closePlayer() {
    loadIdRef.current++;
    stopTracking();
    releasePlayer();
    queueRef.current = [];
    setIsPlaying(false);
    setCurrentSong(null);
    setPosition(0);
    setDuration(180);
  }

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        position,
        duration,
        queue,
        currentIndex,
        playSong,
        togglePlay,
        pause,
        resume,
        nextSong,
        previousSong,
        seekTo,
        closePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}