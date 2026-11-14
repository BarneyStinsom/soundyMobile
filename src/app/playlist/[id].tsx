// src/app/playlist/[id].tsx — espelha pgMusicas.html?tipo=playlist: músicas da playlist,
// remover música e "+ Adicionar músicas".
import { Botao, Capa, Mensagem } from '@/components/ui';
import MiniPlayer from '@/components/player/miniplayer';
import Tela from '@/components/Tela';
import { Song, parseDuration, usePlayer } from '@/contexts/playerContext';
import { useAuth } from '@/contexts/authcontext';
import { imagemUrl } from '@/lib/arquivos';
import { api, ApiError } from '@/services/api';
import { cores } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import MiniPlayer from '@/components/player/miniplayer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View,
} from 'react-native';

type Playlist = { id: string; name: string; description?: string | null; coverUrl?: string | null };
type Item = {
  id: string; position: number;
  song?: { id: string; title: string; duration: number; songCoverUrl?: string | null };
};
type SongApi = { id: string; title: string; duration: number; songCoverUrl?: string | null; artist?: { name: string } };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const normaliza = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function PlaylistConteudo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [todas, setTodas] = useState<SongApi[]>([]);
  const [mensagem, setMensagem] = useState('Carregando...');
  const [adicionar, setAdicionar] = useState(false);
  const [busca, setBusca] = useState('');

  const artistaPorId = useMemo(() => new Map(todas.map((m) => [m.id, m.artist?.name])), [todas]);

  const carregar = useCallback(async (aviso = '') => {
    if (!user) return;
    try {
      const minhas = await api<Playlist[]>(`/users/${user.id}/playlists`);
      const p = minhas.find((x) => x.id === id);
      if (!p) throw new Error('Playlist não encontrada.');
      setPlaylist(p);

      let lista: Item[] = [];
      try {
        lista = (await api<Item[]>(`/playlists/${id}/songs`)) ?? [];
      } catch (e) {
        // a API responde 404 quando a playlist existe mas está vazia
        if (!(e instanceof ApiError) || e.status !== 404) throw e;
      }
      setItens([...lista].sort((a, b) => a.position - b.position));
      setMensagem(aviso || (lista.length === 0 ? 'Esta playlist está vazia.' : ''));
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Erro ao carregar.');
    }
  }, [id, user]);

  useEffect(() => {
    carregar();
    api<SongApi[]>('/songs').then((l) => setTodas(l ?? [])).catch(() => {});
  }, [carregar]);

  const fila: Song[] = itens
    .filter((i) => i.song)
    .map((i) => ({
      id: i.song!.id,
      title: i.song!.title,
      duration: i.song!.duration,
      songCoverUrl: i.song!.songCoverUrl,
      artistName: artistaPorId.get(i.song!.id),
    }));

  function tocar(songId: string) {
    const m = fila.find((s) => s.id === songId);
    if (!m) return;
    playSong(m, fila);
    // router.push({ pathname: '/player/[id]', params: { id: songId } });
  }

  async function remover(item: Item) {
    try {
      await api(`/playlistsongs/${item.id}`, { method: 'DELETE' });
      await carregar(`"${item.song?.title}" removida da playlist.`);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Não foi possível remover.');
    }
  }

  async function adicionarMusica(m: SongApi) {
    const posicao = itens.reduce((max, i) => Math.max(max, i.position), 0) + 1;
    try {
      await api('/playlistsongs', {
        method: 'POST',
        body: JSON.stringify({ playlistId: id, songId: m.id, position: posicao }),
      });
      await carregar(`"${m.title}" adicionada.`);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Não foi possível adicionar.');
    }
  }

  const jaTem = new Set(itens.map((i) => i.song?.id));
  const resultados = todas.filter(
    (m) => !jaTem.has(m.id) &&
      (!busca.trim() || normaliza(`${m.title} ${m.artist?.name ?? ''}`).includes(normaliza(busca.trim()))),
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={itens}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Pressable onPress={() => router.back()} style={s.voltar} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
              <Text style={{ color: '#fff' }}>Playlists</Text>
            </Pressable>
            <View style={s.cabecalho}>
              <Capa uri={imagemUrl(playlist?.coverUrl)} tamanho={130} />
              <View style={{ flex: 1 }}>
                <Text style={s.tipo}>PLAYLIST</Text>
                <Text style={s.titulo} numberOfLines={3}>{playlist?.name ?? ''}</Text>
                <Text style={s.sub}>
                  {playlist?.description || `${itens.length} ${itens.length === 1 ? 'música' : 'músicas'}`}
                </Text>
              </View>
            </View>
            <Botao titulo="+ Adicionar músicas" onPress={() => { setBusca(''); setAdicionar(true); }} variante="rosa" style={{ marginTop: 16, alignSelf: 'flex-start' }} />
            <Mensagem texto={mensagem} />
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable style={s.linha} onPress={() => item.song && tocar(item.song.id)}>
            <Text style={s.num}>{index + 1}</Text>
            <Capa uri={imagemUrl(item.song?.songCoverUrl)} tamanho={46} />
            <View style={{ flex: 1 }}>
              <Text style={s.nomeMusica} numberOfLines={1}>{item.song?.title ?? 'Música removida'}</Text>
              <Text style={s.artista} numberOfLines={1}>{artistaPorId.get(item.song?.id ?? '') ?? ''}</Text>
            </View>
            <Text style={s.dur}>{fmt(parseDuration(item.song?.duration))}</Text>
            <Pressable hitSlop={10} onPress={() => remover(item)}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </Pressable>
        )}
      />

      {/* esta tela fica fora das abas, então o mini player é desenhado aqui (sem barra de abas embaixo) */}
      {!adicionar && <MiniPlayer bottom={12} />}

      <Modal visible={adicionar} animationType="slide" onRequestClose={() => setAdicionar(false)}>
        <SafeAreaView style={s.modalTela}>
          <View style={s.modalTopo}>
            <Text style={s.modalTitulo}>Adicionar músicas</Text>
            <Pressable onPress={() => setAdicionar(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>
          <TextInput
            style={s.busca}
            placeholder="Buscar por título ou artista"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
          />
          <Mensagem texto={mensagem} />
          <FlatList
            data={resultados}
            keyExtractor={(m) => m.id}
            ListEmptyComponent={<Text style={{ color: cores.textoSuave, padding: 16 }}>Nenhuma música encontrada.</Text>}
            renderItem={({ item: m }) => (
              <View style={s.linha}>
                <Capa uri={imagemUrl(m.songCoverUrl)} tamanho={46} />
                <View style={{ flex: 1 }}>
                  <Text style={s.nomeMusica} numberOfLines={1}>{m.title}</Text>
                  <Text style={s.artista} numberOfLines={1}>{m.artist?.name ?? ''}</Text>
                </View>
                <Botao titulo="+ Adicionar" pequeno variante="rosa" onPress={() => adicionarMusica(m)} />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  voltar: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, alignSelf: 'flex-start' },
  cabecalho: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
  tipo: { color: cores.rosa, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 2 },
  sub: { color: cores.textoSuave, marginTop: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  num: { color: cores.textoSuave, width: 20, textAlign: 'center' },
  nomeMusica: { color: '#fff', fontSize: 16, fontWeight: '600' },
  artista: { color: '#ccc', fontSize: 13 },
  dur: { color: cores.textoSuave, fontSize: 13 },
  modalTela: { flex: 1, backgroundColor: '#12020d', padding: 20 },
  modalTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitulo: { color: '#fff', fontSize: 22, fontWeight: '700' },
  busca: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: 10, fontSize: 15, marginBottom: 8,
  },
});

export default function PlaylistDetalhe() {
  return (
    <Tela>
      <PlaylistConteudo />
      <MiniPlayer bottom={16} />
    </Tela>
  );
}