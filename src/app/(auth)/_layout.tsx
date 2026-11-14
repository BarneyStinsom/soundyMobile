// src/app/(auth)/_layout.tsx
import Tela from '@/components/Tela';
import { useAuth } from '@/contexts/authcontext';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { user } = useAuth();

  // já logado? vai direto pro app (igual ao site, que pula o Login.html)
  if (user) return <Redirect href="/" />;

  return (
    <Tela>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'none' }} />
    </Tela>
  );
}
