// src/app/player/[id].tsx
import FullPlayer from '@/components/player/fullplayer';
import { useLocalSearchParams } from 'expo-router';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FullPlayer songId={id} />;
}
