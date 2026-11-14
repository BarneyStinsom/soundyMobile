// src/app/(tabs)/playlists.tsx — espelha playlist/pPlaylists.html do site
import { Botao, Capa, Mensagem } from '@/components/ui';
import Tela from '@/components/Tela';
import { useAuth } from '@/contexts/authcontext';
import { Arquivo, enviarArquivo, escolherImagem, imagemUrl } from '@/lib/arquivos';
import { confirmar } from '@/lib/confirmar';
import { api } from '@/services/api';
import { cores } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';

type Playlist = { id: string; name: string; description?: string | null; coverUrl?: string | null };

function PlaylistsConteudo() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [modal, setModal] = useState(false);

  const carregar = useCallback(async (aviso = '') => {
    if (!user) return;
    if (!aviso) setMensagem('Carregando playlists...');
    try {
      const lista = await api<Playlist[]>(`/users/${user.id}/playlists`);
      setPlaylists(lista ?? []);
      const vazio = !lista || lista.length === 0 ? 'Você ainda não tem playlists.' : '';
      setMensagem([aviso, vazio].filter(Boolean).join(' '));
    } catch (e) {
      setPlaylists([]);
      setMensagem(e instanceof Error ? e.message : 'Erro ao carregar.');
    }
  }, [user]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function excluir(p: Playlist) {
    const ok = await confirmar('Excluir playlist', `Excluir a playlist "${p.name}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      await api(`/playlists/${p.id}`, { method: 'DELETE' });
      await carregar('Playlist excluída.');
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Não foi possível excluir a playlist.');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ padding: 20, paddingTop: 48, paddingBottom: 130, gap: 22 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 4 }}>
            <Text style={s.titulo}>Playlists</Text>
            <Text style={s.subtitulo}>Suas coleções favoritas</Text>
            <Pressable style={s.criar} onPress={() => setModal(true)}>
              <Text style={s.criarTexto}>+ Criar playlist</Text>
            </Pressable>
            <Mensagem texto={mensagem} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={s.card}
            onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: item.id } })}
          >
            <View>
              <Capa uri={imagemUrl(item.coverUrl)} />
              <Pressable style={s.excluir} hitSlop={8} onPress={() => excluir(item)}>
                <Ionicons name="trash" size={15} color="#fff" />
              </Pressable>
            </View>
            <Text style={s.nome} numberOfLines={1}>{item.name}</Text>
            {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
          </Pressable>
        )}
      />
      <CriarPlaylist
        visivel={modal}
        userId={user?.id ?? ''}
        onFechar={() => setModal(false)}
        onCriada={() => { setModal(false); carregar('Playlist criada.'); }}
      />
    </View>
  );
}

// ---------- MODAL: CRIAR PLAYLIST ----------
function CriarPlaylist({
  visivel, userId, onFechar, onCriada,
}: { visivel: boolean; userId: string; onFechar: () => void; onCriada: () => void }) {
  const [nome, setNome] = useState('');
  const [capa, setCapa] = useState<Arquivo | null>(null);
  const [publica, setPublica] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function fechar() {
    setNome(''); setCapa(null); setPublica(false); setErro(''); setEnviando(false);
    onFechar();
  }

  async function escolher() {
    try {
      const arq = await escolherImagem();
      if (arq) { setCapa(arq); setErro(''); }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível escolher a imagem.');
    }
  }

  async function criar() {
    if (!nome.trim()) { setErro('Digite um nome para a playlist.'); return; }
    setEnviando(true);
    setErro('');
    try {
      const body: Record<string, unknown> = { name: nome.trim(), userId, isPublic: publica };
      if (capa) body.coverUrl = await enviarArquivo('image', capa);
      await api('/playlists', { method: 'POST', body: JSON.stringify(body) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a playlist.');
      setEnviando(false);
      return;
    }
    setNome(''); setCapa(null); setPublica(false); setEnviando(false);
    onCriada();
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <KeyboardAvoidingView style={s.fundoModal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} />
        <View style={s.dialogo}>
          <Text style={s.dialogoTitulo}>Nova playlist</Text>

          <Text style={s.rotulo}>Nome</Text>
          <TextInput
            style={s.input}
            value={nome}
            onChangeText={setNome}
            maxLength={100}
            autoCorrect={false}
            placeholderTextColor="rgba(255,255,255,0.4)"
          />

          <Text style={s.rotulo}>Capa (opcional)</Text>
          <Pressable style={s.arquivo} onPress={escolher}>
            <Ionicons name="image-outline" size={18} color="#000" />
            <Text style={{ color: '#000' }}>Escolher imagem</Text>
          </Pressable>
          <Text style={s.dica}>{capa ? capa.name : 'Nenhum arquivo selecionado'}</Text>

          <View style={s.linhaSwitch}>
            <Switch value={publica} onValueChange={setPublica} trackColor={{ true: cores.rosa }} />
            <Text style={{ color: '#fff' }}>Playlist pública</Text>
          </View>

          <Text style={s.erro}>{erro}</Text>

          <View style={s.acoes}>
            <Botao titulo="Cancelar" onPress={fechar} style={{ flex: 1 }} />
            <Botao titulo="Criar playlist" variante="rosa" onPress={criar} carregando={enviando} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  titulo: { color: '#fff', fontSize: 38, fontWeight: '700' },
  subtitulo: { color: cores.textoSuave, fontSize: 16, marginTop: 6, marginBottom: 24 },
  criar: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: cores.rosa, borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 22, marginBottom: 8,
  },
  criarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { flex: 1 },
  nome: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 12, marginHorizontal: 2 },
  desc: { color: cores.textoFraco, fontSize: 13, marginHorizontal: 2, marginTop: 2 },
  excluir: {
    position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialogo: {
    width: '100%', maxWidth: 360, backgroundColor: '#1a0210', borderRadius: 28, padding: 26,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  dialogoTitulo: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  rotulo: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)', color: '#fff', padding: 10, fontSize: 15,
  },
  arquivo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  dica: { color: cores.textoFraco, fontSize: 12, marginTop: 4 },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  erro: { color: cores.erro, minHeight: 20, marginTop: 8 },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 6 },
});

export default function Playlists() {
  return (
    <Tela>
      <PlaylistsConteudo />
    </Tela>
  );
}
