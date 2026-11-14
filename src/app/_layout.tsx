// src/app/_layout.tsx
import { AuthProvider, useAuth } from '@/contexts/authcontext';
import { PlayerProvider } from '@/contexts/playerContext';
import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// O tema padrão do React Navigation pinta cada tela com uma cor sólida e cobre o <Fundo />.
// Com background/card transparentes, as telas deixam o fundo de ondas aparecer.
const TemaTransparente = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', card: 'transparent' },
};

function RootStack() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#b91d92" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        // sem slide/fade entre telas transparentes, senão as duas aparecem juntas
        animation: 'none',
      }}
    >
      <Stack.Screen name="playlist/[id]" options={{ contentStyle: { backgroundColor: '#000' } }} />
      <Stack.Screen
        name="player/[id]"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#12020d' }
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <ThemeProvider value={TemaTransparente}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
            <RootStack />
          </View>
        </ThemeProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
