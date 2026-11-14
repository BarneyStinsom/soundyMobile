// src/app/(tabs)/index.tsx
import Tela from '@/components/Tela';
import { usePlayer } from '@/contexts/playerContext';
import { api } from '@/services/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';

type TopSong = {
  songId: string;
  id: string;
  title: string;
  artistName?: string;
  songCoverUrl?: string | null;
  playCount: number;
  duration?: number | string;
};

function HomeConteudo() {
  const [songs, setSongs] = useState<TopSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { playSong } = usePlayer();

  useEffect(() => {
    async function loadTopHits() {
      try {
        const data = await api<TopSong[]>('/songs/top?limit=10');
        setSongs(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar.');
      } finally {
        setLoading(false);
      }
    }
    loadTopHits();
  }, []);

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#b91d92" />;
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <FlatList
      data={songs}
      keyExtractor={(song) => song.songId || song.id}
      ListHeaderComponent={<Text style={styles.title}>Em alta no mundo!</Text>}
      contentContainerStyle={{ paddingBottom: 100, backgroundColor: 'transparent' }}
      style={{ backgroundColor: 'transparent' }}
      renderItem={({ item, index }) => (
        <Pressable
          style={styles.row}
          onPress={() => {
            playSong(item, songs);
            router.push({ pathname: '/player/[id]', params: { id: item.songId || item.id } });
          }}
        >
          <Text style={styles.rank}>{index + 1}</Text>
          {item.songCoverUrl ? (
            <Image source={{ uri: item.songCoverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverEmpty]} />
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{item.artistName ?? ''}</Text>
          </View>
          <Text style={styles.plays}>
            {item.playCount} {item.playCount === 1 ? 'reprodução' : 'reproduções'}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, textAlign: 'center', textAlignVertical: 'center', color: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', padding: 16, color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  rank: { width: 24, fontWeight: 'bold', color: '#fff' },
  cover: { width: 48, height: 48, borderRadius: 6 },
  coverEmpty: { backgroundColor: '#ccc' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  artist: { color: '#ccc' },
  plays: { fontSize: 12, color: '#ccc' },
});

export default function Home() {
  return (
    <Tela>
      <HomeConteudo />
    </Tela>
  );
}
