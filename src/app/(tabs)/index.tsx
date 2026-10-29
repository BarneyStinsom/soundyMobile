// src/app/(tabs)/index.tsx
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
};

export default function Home() {
  const [songs, setSongs] = useState<TopSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <FlatList
      data={songs}
      keyExtractor={(song) => song.songId}
      ListHeaderComponent={<Text style={styles.title}>Em alta no mundo!</Text>}
      renderItem={({ item, index }) => (
        <Pressable
          style={styles.row}
         onPress={() => router.push({ pathname: '/player/[id]', params: { id: item.songId } })}
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
  center: { flex: 1, textAlign: 'center', textAlignVertical: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  rank: { width: 24, fontWeight: 'bold' },
  cover: { width: 48, height: 48, borderRadius: 6 },
  coverEmpty: { backgroundColor: '#ccc' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  artist: { color: '#666' },
  plays: { fontSize: 12, color: '#666' },
});