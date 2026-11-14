// src/app/(tabs)/admin.tsx — espelha admin/dashboard.html (Início, Artistas, Álbuns, Músicas)
import Albuns from '@/components/admin/Albuns';
import Artistas from '@/components/admin/Artistas';
import Musicas from '@/components/admin/Musicas';
import Tela from '@/components/Tela';
import { useAuth } from '@/contexts/authcontext';
import { cores } from '@/theme';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Secao = 'inicio' | 'artistas' | 'albuns' | 'musicas';

const ABAS: { id: Secao; texto: string }[] = [
  { id: 'inicio', texto: 'Início' },
  { id: 'artistas', texto: 'Artistas' },
  { id: 'albuns', texto: 'Álbuns' },
  { id: 'musicas', texto: 'Músicas' },
];

const CARTOES: { id: Secao; icone: string; titulo: string; texto: string }[] = [
  { id: 'artistas', icone: '🎤', titulo: 'Artistas', texto: 'Adicionar, editar e remover artistas.' },
  { id: 'albuns', icone: '💿', titulo: 'Álbuns', texto: 'Adicionar, editar e remover álbuns.' },
  { id: 'musicas', icone: '🎵', titulo: 'Músicas', texto: 'Adicionar, editar e remover músicas.' },
];

function AdminConteudo() {
  const { user } = useAuth();
  const [secao, setSecao] = useState<Secao>('inicio');

  // protege também a rota direta (ex.: link/URL na web)
  if (!user?.isAdmin) return <Redirect href="/" />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topo}>
        <Text style={s.marca}>Painel Admin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {ABAS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setSecao(a.id)}
              style={[s.aba, secao === a.id && s.abaAtiva]}
            >
              <Text style={{ color: '#fff', fontWeight: secao === a.id ? '700' : '400' }}>{a.texto}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {secao === 'inicio' && (
          <View>
            <Text style={s.h1}>Bem-vindo ao painel</Text>
            <Text style={s.sub}>Gerencie o catálogo do Soundy: artistas, álbuns e músicas.</Text>
            <View style={{ gap: 14, marginTop: 20 }}>
              {CARTOES.map((c) => (
                <Pressable key={c.id} style={s.cartao} onPress={() => setSecao(c.id)}>
                  <Text style={{ fontSize: 30 }}>{c.icone}</Text>
                  <Text style={s.cartaoTitulo}>{c.titulo}</Text>
                  <Text style={{ color: cores.textoSuave }}>{c.texto}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {secao === 'artistas' && <Artistas />}
        {secao === 'albuns' && <Albuns />}
        {secao === 'musicas' && <Musicas />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  topo: {
    paddingTop: 44, paddingHorizontal: 16, paddingBottom: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.35)',
  },
  marca: { color: '#fff', fontWeight: '700', fontSize: 18 },
  aba: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  abaAtiva: { backgroundColor: cores.rosa, borderColor: cores.rosa },
  h1: { color: '#fff', fontSize: 30, fontWeight: '700' },
  sub: { color: cores.textoSuave, marginTop: 4 },
  cartao: {
    backgroundColor: cores.vidro, borderWidth: 1, borderColor: cores.vidroBorda,
    borderRadius: 16, padding: 18, gap: 4,
  },
  cartaoTitulo: { color: '#fff', fontSize: 20, fontWeight: '700' },
});

export default function Admin() {
  return (
    <Tela>
      <AdminConteudo />
    </Tela>
  );
}
