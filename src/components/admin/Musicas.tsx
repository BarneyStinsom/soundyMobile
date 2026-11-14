// src/components/admin/Musicas.tsx — admin/musicas.html + js/musicas.js
import { AcoesForm, CampoArquivo, LinhaTabela, Msg, SEM_MSG, Titulo, VazioTabela } from '@/components/admin/Comum';
import { Botao, Campo, Capa, Mensagem, Painel, Seletor } from '@/components/ui';
import { Arquivo, enviarArquivo, escolherAudio, escolherImagem, imagemUrl, lerDuracao } from '@/lib/arquivos';
import { confirmar } from '@/lib/confirmar';
import { api } from '@/services/api';
import { cores } from '@/theme';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type Artista = { id: string; name: string };
type Album = { id: string; title: string; artistId?: string; artist?: { id: string } };
type Musica = {
  id: string; title: string; duration: number; songUrl?: string; songCoverUrl?: string | null;
  artist?: { id: string; name: string }; album?: { id: string };
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Musicas() {
  const [musicas, setMusicas] = useState<Musica[] | null>(null);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [albuns, setAlbuns] = useState<Album[]>([]);
  const [erroPagina, setErroPagina] = useState('');
  const [editId, setEditId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [duracao, setDuracao] = useState('');
  const [artistaId, setArtistaId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [audio, setAudio] = useState<Arquivo | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [capa, setCapa] = useState<Arquivo | null>(null);
  const [capaUrl, setCapaUrl] = useState('');
  const [msg, setMsg] = useState<Msg>(SEM_MSG);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [m, ar, al] = await Promise.all([
        api<Musica[]>('/songs'), api<Artista[]>('/artists'), api<Album[]>('/albums'),
      ]);
      setMusicas(m); setArtistas(ar); setAlbuns(al); setErroPagina('');
    } catch {
      setErroPagina('Não foi possível carregar as músicas.');
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  // o backend exige que o álbum pertença ao artista: só mostra os do artista escolhido
  const albunsDoArtista = albuns.filter((a) => (a.artistId || a.artist?.id) === artistaId);

  function limpar() {
    setEditId(''); setTitulo(''); setDuracao(''); setArtistaId(''); setAlbumId('');
    setAudio(null); setAudioUrl(''); setCapa(null); setCapaUrl(''); setMsg(SEM_MSG);
  }

  async function editar(m: Musica) {
    setMsg({ texto: 'Carregando dados da música...', tipo: 'info' });
    try {
      // a listagem não traz artistId/albumId: busca os detalhes completos
      const full = await api<Musica>(`/songs/${m.id}`);
      setEditId(full.id); setTitulo(full.title); setDuracao(String(full.duration ?? ''));
      setAudio(null); setCapa(null);
      setAudioUrl(full.songUrl || ''); setCapaUrl(full.songCoverUrl || '');
      setArtistaId(full.artist?.id || ''); setAlbumId(full.album?.id || '');
      setMsg(SEM_MSG);
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Não foi possível carregar a música.', tipo: 'erro' });
    }
  }

  async function escolherAudioArq() {
    try {
      const f = await escolherAudio();
      if (!f) return;
      setAudio(f);
      const d = await lerDuracao(f.uri); // preenche a duração sozinho, como no site
      if (d) setDuracao(String(d));
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Não foi possível escolher o áudio.', tipo: 'erro' });
    }
  }

  async function escolherCapa() {
    try {
      const f = await escolherImagem();
      if (f) setCapa(f);
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Imagem inválida.', tipo: 'erro' });
    }
  }

  async function excluir(m: Musica) {
    if (!(await confirmar('Excluir música', `Excluir a música "${m.title}"? Essa ação não pode ser desfeita.`))) return;
    try {
      await api(`/songs/${m.id}`, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErroPagina(e instanceof Error ? e.message : 'Não foi possível excluir a música.');
    }
  }

  async function salvar() {
    if (!titulo.trim()) { setMsg({ texto: 'Digite o título.', tipo: 'erro' }); return; }
    if (!artistaId || !albumId) { setMsg({ texto: 'Selecione o artista e o álbum.', tipo: 'erro' }); return; }
    if (!editId && !audio) { setMsg({ texto: 'Selecione o arquivo de áudio.', tipo: 'erro' }); return; }
    const dur = parseInt(duracao, 10);
    if (!dur || dur < 30) { setMsg({ texto: 'Informe a duração em segundos (mínimo 30).', tipo: 'erro' }); return; }

    setEnviando(true);
    try {
      let songUrl = audioUrl.trim();
      let songCoverUrl: string | undefined = capaUrl.trim() || undefined;
      if (audio) {
        setMsg({ texto: 'Enviando áudio...', tipo: 'info' });
        songUrl = await enviarArquivo('audio', audio);
      }
      if (capa) {
        setMsg({ texto: 'Enviando capa...', tipo: 'info' });
        songCoverUrl = await enviarArquivo('image', capa);
      }
      const payload = { title: titulo.trim(), duration: dur, songUrl, artistId: artistaId, albumId, songCoverUrl };
      if (editId) {
        await api(`/songs/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/songs', { method: 'POST', body: JSON.stringify(payload) });
      }
      const ok = editId ? 'Música atualizada com sucesso.' : 'Música adicionada com sucesso.';
      await carregar();
      limpar();
      setMsg({ texto: ok, tipo: 'sucesso' });
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Não foi possível salvar a música.', tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View>
      <Titulo titulo="Músicas" sub="Cadastre novas músicas ou edite as existentes." />
      <Painel titulo={editId ? `Editando: ${titulo}` : 'Nova música'}>
        <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} />
        <Campo rotulo="Duração (segundos)" value={duracao} onChangeText={setDuracao} keyboardType="number-pad" />
        <Seletor
          rotulo="Artista" valor={artistaId}
          onChange={(v) => { setArtistaId(v); setAlbumId(''); }}
          opcoes={artistas.map((a) => ({ valor: a.id, texto: a.name }))}
        />
        <Seletor
          rotulo="Álbum" valor={albumId} onChange={setAlbumId}
          placeholder={!artistaId ? 'Selecione um artista primeiro' : albunsDoArtista.length === 0 ? 'Este artista não tem álbuns ainda' : 'Selecione...'}
          opcoes={albunsDoArtista.map((a) => ({ valor: a.id, texto: a.title }))}
        />
        <CampoArquivo
          rotulo="Arquivo de áudio (mp3, wav, ogg)"
          onEscolher={escolherAudioArq}
          arquivo={audio}
          dica={audioUrl ? 'Já tem um áudio. Escolha um arquivo só se quiser trocar.' : undefined}
        />
        <CampoArquivo
          rotulo="Capa (imagem, opcional)"
          onEscolher={escolherCapa}
          arquivo={capa}
          dica={capaUrl ? 'Já tem uma capa. Escolha um arquivo só se quiser trocar.' : undefined}
        />
        <AcoesForm
          editando={!!editId} textoEnviar="Adicionar música" textoSalvar="Salvar alterações"
          enviando={enviando} onEnviar={salvar} onCancelar={limpar} msg={msg}
        />
      </Painel>

      <Painel>
        {musicas === null ? (
          <VazioTabela texto="Carregando..." />
        ) : musicas.length === 0 ? (
          <VazioTabela texto="Nenhuma música cadastrada ainda" />
        ) : (
          musicas.map((m) => (
            <LinhaTabela key={m.id}>
              <Capa uri={imagemUrl(m.songCoverUrl)} tamanho={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16 }} numberOfLines={1}>{m.title}</Text>
                <Text style={{ color: cores.textoSuave, fontSize: 12 }} numberOfLines={1}>
                  {fmt(m.duration)} · {m.artist?.name ?? '—'}
                </Text>
              </View>
              <Botao titulo="Editar" pequeno onPress={() => editar(m)} />
              <Botao titulo="Excluir" pequeno variante="perigo" onPress={() => excluir(m)} />
            </LinhaTabela>
          ))
        )}
      </Painel>
      <Mensagem texto={erroPagina} tipo="erro" />
    </View>
  );
}
