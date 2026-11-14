// src/app/(tabs)/perfil.tsx — espelha menu/perfil.html + js/pUser.js do site
import { Botao, Capa, Mensagem } from '@/components/ui';
import Tela from '@/components/Tela';
import { useAuth } from '@/contexts/authcontext';
import { enviarArquivo, escolherImagem, imagemUrl } from '@/lib/arquivos';
import { confirmar } from '@/lib/confirmar';
import { api } from '@/services/api';
import { cores } from '@/theme';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Usuario = { name: string; email: string; pictureUrl?: string | null };

function PerfilConteudo() {
  const { user, signOut } = useAuth();
  const [dados, setDados] = useState<Usuario | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [tipo, setTipo] = useState<'info' | 'erro' | 'sucesso'>('info');
  const [ocupado, setOcupado] = useState(false);

  function avisar(texto: string, t: 'info' | 'erro' | 'sucesso' = 'info') {
    setAviso(texto);
    setTipo(t);
  }

  useEffect(() => {
    if (!user) return;
    api<Usuario>(`/users/${user.id}`)
      .then((u) => { setDados(u); setFoto(imagemUrl(u.pictureUrl)); })
      .catch(() => avisar('Não foi possível carregar seu perfil.', 'erro'));
  }, [user]);

  async function trocarFoto() {
    if (!user) return;
    try {
      const arquivo = await escolherImagem();
      if (!arquivo) return;
      setOcupado(true);
      avisar('Enviando foto...');
      const url = await enviarArquivo('image', arquivo);
      await api(`/users/${user.id}/picture`, { method: 'PATCH', body: JSON.stringify({ pictureUrl: url }) });
      setFoto(url);
      avisar('Foto atualizada com sucesso!', 'sucesso');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível alterar a foto.', 'erro');
    } finally {
      setOcupado(false);
    }
  }

  async function excluirConta() {
    if (!user) return;
    const ok = await confirmar(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.',
    );
    if (!ok) return;
    try {
      await api(`/users/${user.id}`, { method: 'DELETE' });
      await signOut();
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível excluir a conta', 'erro');
    }
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.card}>
        <View style={s.cabecalho}>
          <Capa uri={foto} tamanho={150} redonda icone="person" style={s.foto} />
          <Botao titulo="Trocar foto" variante="rosa" pequeno onPress={trocarFoto} carregando={ocupado} style={s.trocar} />
          <Text style={s.nome}>{dados?.name ?? user?.name ?? 'Carregando...'}</Text>
        </View>

        <View style={s.info}>
          <Text style={s.infoRotulo}>E-mail</Text>
          <Text style={s.infoValor}>{dados?.email ?? user?.email ?? ''}</Text>
        </View>

        <View style={s.acoes}>
          <Botao titulo="Sair" onPress={signOut} style={{ flex: 1 }} />
          <Botao titulo="Excluir conta" variante="perigo" onPress={excluirConta} style={{ flex: 1 }} />
        </View>

        <Mensagem texto={aviso} tipo={tipo} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 120 },
  card: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 28,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cabecalho: { alignItems: 'center' },
  foto: { borderWidth: 4, borderColor: cores.rosa },
  trocar: { marginTop: 14, borderRadius: 20 },
  nome: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 18, textAlign: 'center' },
  info: {
    marginTop: 30, padding: 18, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 6,
  },
  infoRotulo: { color: cores.rosa, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  infoValor: { color: '#eee', fontSize: 16 },
  acoes: { flexDirection: 'row', gap: 12, marginTop: 26 },
});

export default function Perfil() {
  return (
    <Tela>
      <PerfilConteudo />
    </Tela>
  );
}
