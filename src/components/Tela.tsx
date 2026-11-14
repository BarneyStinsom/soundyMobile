// src/components/Tela.tsx
// Fundo de ondas + conteúdo. Cada aba usa este wrapper e tem fundo OPACO,
// assim uma aba sempre cobre totalmente a anterior (sem imagem "fantasma" nem sobreposição).
import Fundo from '@/components/Fundo';
import { useIsFocused } from 'expo-router/react-navigation';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export default function Tela({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
      {focused && <Fundo />}
      {children}
    </View>
  );
}
