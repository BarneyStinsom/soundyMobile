// src/components/admin/Albuns.tsx — admin/albuns.html + js/albuns.js
import { AcoesForm, CampoArquivo, LinhaTabela, Msg, SEM_MSG, Titulo, VazioTabela } from '@/components/admin/Comum';
import { Botao, Campo, Capa, Mensagem, Painel, Seletor } from '@/components/ui';
import { Arquivo, enviarArquivo, escolherImagem, imagemUrl } from '@/lib/arquivos';
import { confirmar } from '@/lib/confirmar';
import { api } from '@/services/api';
import { cores } from '@/theme';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type Artista = { id: string; name: string };
type Album = { id: string; title: string; type: string; coverUrl?: string | null; artistId?: string; artist?: { id: string; name: string } };

const TIPOS = ['Álbum', 'Single', 'EP', 'Coletânea'].map((t) => ({ valor: t, texto: t }));

export default function Albuns() {
  const [albuns, setAlbuns] = useState<Album[] | null>(null);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [erroPagina, setErroPagina] = useState('');
  const [editId, setEditId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Álbum');
  const [artistaId, setArtistaId] = useState('');
  const [capa, setCapa] = useState<Arquivo | null>(null);
  const [capaUrl, setCapaUrl] = useState('');
  const [msg, setMsg] = useState<Msg>(SEM_MSG);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [al, ar] = await Promise.all([api<Album[]>('/albums'), api<Artista[]>('/artists')]);
      setAlbuns(al); setArtistas(ar); setErroPagina('');
    } catch {
      setErroPagina('Não foi possível carregar os álbuns.');
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  function limpar() {
    setEditId(''); setTitulo(''); setTipo('Álbum'); setArtistaId(''); setCapa(null); setCapaUrl(''); setMsg(SEM_MSG);
  }

  function editar(a: Album) {
    setEditId(a.id); setTitulo(a.title); setTipo(a.type); setArtistaId(a.artistId || a.artist?.id || '');
    setCapa(null); setCapaUrl(a.coverUrl || ''); setMsg(SEM_MSG);
  }

  async function escolher() {
    try {
      const f = await escolherImagem();
      if (f) setCapa(f);
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Imagem inválida.', tipo: 'erro' });
    }
  }

  async function excluir(a: Album) {
    if (!(await confirmar('Excluir álbum', `Excluir o álbum "${a.title}"? Essa ação não pode ser desfeita.`))) return;
    try {
      await api(`/albums/${a.id}`, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErroPagina(e instanceof Error ? e.message : 'Não foi possível excluir o álbum.');
    }
  }

  async function salvar() {
    if (!titulo.trim() || !artistaId) {
      setMsg({ texto: 'Informe o título e selecione o artista.', tipo: 'erro' });
      return;
    }
    setEnviando(true);
    setMsg(SEM_MSG);
    try {
      let coverUrl: string | undefined = capaUrl.trim() || undefined;
      if (capa) coverUrl = await enviarArquivo('image', capa);
      const payload = { title: titulo.trim(), type: tipo, artistId: artistaId, coverUrl };
      if (editId) {
        await api(`/albums/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/albums', { method: 'POST', body: JSON.stringify(payload) });
      }
      const ok = editId ? 'Álbum atualizado com sucesso.' : 'Álbum adicionado com sucesso.';
      await carregar();
      limpar();
      setMsg({ texto: ok, tipo: 'sucesso' });
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Não foi possível salvar o álbum.', tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View>
      <Titulo titulo="Álbuns" sub="Cadastre novos álbuns, EPs e singles ou edite os existentes." />
      <Painel titulo={editId ? `Editando: ${titulo}` : 'Novo álbum'}>
        <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} />
        <Seletor rotulo="Tipo" valor={tipo} opcoes={TIPOS} onChange={setTipo} />
        <Seletor
          rotulo="Artista" valor={artistaId} onChange={setArtistaId}
          opcoes={artistas.map((a) => ({ valor: a.id, texto: a.name }))}
        />
        <CampoArquivo
          rotulo="Capa (imagem, opcional)"
          onEscolher={escolher}
          arquivo={capa}
          dica={capaUrl ? 'Já tem uma capa. Escolha um arquivo só se quiser trocar.' : undefined}
        />
        <AcoesForm
          editando={!!editId} textoEnviar="Adicionar álbum" textoSalvar="Salvar alterações"
          enviando={enviando} onEnviar={salvar} onCancelar={limpar} msg={msg}
        />
      </Painel>

      <Painel>
        {albuns === null ? (
          <VazioTabela texto="Carregando..." />
        ) : albuns.length === 0 ? (
          <VazioTabela texto="Nenhum álbum cadastrado ainda" />
        ) : (
          albuns.map((a) => (
            <LinhaTabela key={a.id}>
              <Capa uri={imagemUrl(a.coverUrl)} tamanho={44} icone="disc" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16 }} numberOfLines={1}>{a.title}</Text>
                <Text style={{ color: cores.textoSuave, fontSize: 12 }} numberOfLines={1}>
                  {a.type} · {a.artist?.name ?? artistas.find((x) => x.id === a.artistId)?.name ?? '—'}
                </Text>
              </View>
              <Botao titulo="Editar" pequeno onPress={() => editar(a)} />
              <Botao titulo="Excluir" pequeno variante="perigo" onPress={() => excluir(a)} />
            </LinhaTabela>
          ))
        )}
      </Painel>
      <Mensagem texto={erroPagina} tipo="erro" />
    </View>
  );
}
