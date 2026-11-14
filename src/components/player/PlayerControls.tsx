// src/components/player/PlayerControls.tsx
import { usePlayer } from '@/contexts/playerContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface PlayerControlsProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function PlayerControls({ size = 'large', color = '#ffffff' }: PlayerControlsProps) {
  const { isPlaying, togglePlay, nextSong, previousSong } = usePlayer();
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const isLarge = size === 'large';
  const playIconSize = isLarge ? 36 : 24;
  const navIconSize = isLarge ? 28 : 20;
  const secondaryIconSize = isLarge ? 22 : 16;

  return (
    <View style={styles.container}>
      {isLarge && (
        <Pressable onPress={() => setIsShuffle(!isShuffle)} style={styles.button}>
          <Ionicons
            name="shuffle"
            size={secondaryIconSize}
            color={isShuffle ? '#e04bc0' : 'rgba(255, 255, 255, 0.6)'}
          />
        </Pressable>
      )}

      <Pressable onPress={previousSong} style={styles.button}>
        <Ionicons name="play-skip-back" size={navIconSize} color={color} />
      </Pressable>

      <Pressable
        onPress={togglePlay}
        style={[styles.playButton, isLarge && styles.playButtonLarge]}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={playIconSize}
          color="#1a0210"
          style={!isPlaying ? { marginLeft: 3 } : undefined}
        />
      </Pressable>

      <Pressable onPress={nextSong} style={styles.button}>
        <Ionicons name="play-skip-forward" size={navIconSize} color={color} />
      </Pressable>

      {isLarge && (
        <Pressable onPress={() => setIsRepeat(!isRepeat)} style={styles.button}>
          <Ionicons
            name="repeat"
            size={secondaryIconSize}
            color={isRepeat ? '#e04bc0' : 'rgba(255, 255, 255, 0.6)'}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  button: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e04bc0',
  },
});
