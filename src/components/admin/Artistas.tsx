// src/components/admin/Artistas.tsx — admin/artistas.html + js/artistas.js
import { AcoesForm, CampoArquivo, LinhaTabela, Msg, SEM_MSG, Titulo, VazioTabela } from '@/components/admin/Comum';
import { Botao, Campo, Capa, Mensagem, Painel } from '@/components/ui';
import { Arquivo, enviarArquivo, escolherImagem, imagemUrl } from '@/lib/arquivos';
import { confirmar } from '@/lib/confirmar';
import { api } from '@/services/api';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type Artista = { id: string; name: string; coverUrl?: string | null };

export default function Artistas() {
  const [lista, setLista] = useState<Artista[] | null>(null);
  const [erroPagina, setErroPagina] = useState('');
  const [editId, setEditId] = useState('');
  const [nome, setNome] = useState('');
  const [capa, setCapa] = useState<Arquivo | null>(null);
  const [capaUrl, setCapaUrl] = useState('');
  const [msg, setMsg] = useState<Msg>(SEM_MSG);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista(await api<Artista[]>('/artists'));
      setErroPagina('');
    } catch {
      setErroPagina('Não foi possível carregar os artistas.');
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  function limpar() {
    setEditId(''); setNome(''); setCapa(null); setCapaUrl(''); setMsg(SEM_MSG);
  }

  function editar(a: Artista) {
    setEditId(a.id); setNome(a.name); setCapa(null); setCapaUrl(a.coverUrl || ''); setMsg(SEM_MSG);
  }

  async function escolher() {
    try {
      const f = await escolherImagem();
      if (f) setCapa(f);
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Imagem inválida.', tipo: 'erro' });
    }
  }

  async function excluir(a: Artista) {
    if (!(await confirmar('Excluir artista', `Excluir o artista "${a.name}"? Essa ação não pode ser desfeita.`))) return;
    try {
      await api(`/artists/${a.id}`, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErroPagina(e instanceof Error ? e.message : 'Não foi possível excluir o artista.');
    }
  }

  async function salvar() {
    if (!nome.trim()) { setMsg({ texto: 'Digite o nome do artista.', tipo: 'erro' }); return; }
    setEnviando(true);
    setMsg(SEM_MSG);
    try {
      let coverUrl: string | undefined = capaUrl.trim() || undefined;
      if (capa) coverUrl = await enviarArquivo('image', capa);
      const payload = { name: nome.trim(), coverUrl };
      if (editId) {
        await api(`/artists/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/artists', { method: 'POST', body: JSON.stringify(payload) });
      }
      const ok = editId ? 'Artista atualizado com sucesso.' : 'Artista adicionado com sucesso.';
      await carregar();
      limpar();
      setMsg({ texto: ok, tipo: 'sucesso' });
    } catch (e) {
      setMsg({ texto: e instanceof Error ? e.message : 'Não foi possível salvar o artista.', tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View>
      <Titulo titulo="Artistas" sub="Cadastre novos artistas ou edite os existentes." />
      <Painel titulo={editId ? `Editando: ${nome}` : 'Novo artista'}>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} />
        <CampoArquivo
          rotulo="Foto / capa (imagem, opcional)"
          onEscolher={escolher}
          arquivo={capa}
          dica={capaUrl ? 'Já tem uma imagem. Escolha um arquivo só se quiser trocar.' : undefined}
        />
        <AcoesForm
          editando={!!editId} textoEnviar="Adicionar artista" textoSalvar="Salvar alterações"
          enviando={enviando} onEnviar={salvar} onCancelar={limpar} msg={msg}
        />
      </Painel>

      <Painel>
        {lista === null ? (
          <VazioTabela texto="Carregando..." />
        ) : lista.length === 0 ? (
          <VazioTabela texto="Nenhum artista cadastrado ainda" />
        ) : (
          lista.map((a) => (
            <LinhaTabela key={a.id}>
              <Capa uri={imagemUrl(a.coverUrl)} tamanho={44} icone="mic" />
              <Text style={{ color: '#fff', flex: 1, fontSize: 16 }} numberOfLines={1}>{a.name}</Text>
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
