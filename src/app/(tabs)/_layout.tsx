// src/app/(tabs)/_layout.tsx
import MiniPlayer from '@/components/player/miniplayer';
import { useAuth } from '@/contexts/authcontext';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabsLayout() {
  const { user } = useAuth();

  // não logado? volta pro login
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'none',
          sceneStyle: {
            backgroundColor: '#000',
          },
          tabBarActiveTintColor: '#e04bc0',
          tabBarInactiveTintColor: '#bbb',
          tabBarStyle: {
            backgroundColor: '#1a0210',
            borderTopColor: 'rgba(255,255,255,0.15)',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            // href: null esconde a aba; undefined mantém ela visível
            href: user.isAdmin ? '/admin' : null,
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
