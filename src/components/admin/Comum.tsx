// src/components/admin/Comum.tsx — peças usadas pelas 3 telas do painel
import { Botao, Mensagem } from '@/components/ui';
import { Arquivo } from '@/lib/arquivos';
import { cores } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

export type Msg = { texto: string; tipo: 'info' | 'erro' | 'sucesso' };
export const SEM_MSG: Msg = { texto: '', tipo: 'info' };

// Botão "Escolher arquivo" + dica do que já está selecionado (como o <input type="file"> do site)
export function CampoArquivo({
  rotulo, onEscolher, arquivo, dica,
}: { rotulo: string; onEscolher: () => void; arquivo: Arquivo | null; dica?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Botao titulo="Escolher arquivo" onPress={onEscolher} pequeno style={{ alignSelf: 'flex-start' }} />
      <Text style={s.dica}>{arquivo ? arquivo.name : dica || 'Nenhum arquivo selecionado'}</Text>
    </View>
  );
}

export function AcoesForm({
  editando, textoEnviar, textoSalvar, enviando, onEnviar, onCancelar, msg,
}: {
  editando: boolean; textoEnviar: string; textoSalvar: string; enviando: boolean;
  onEnviar: () => void; onCancelar: () => void; msg: Msg;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Botao titulo={editando ? textoSalvar : textoEnviar} variante="primario" onPress={onEnviar} carregando={enviando} />
        {editando && <Botao titulo="Cancelar edição" onPress={onCancelar} />}
      </View>
      <Mensagem texto={msg.texto} tipo={msg.tipo} />
    </View>
  );
}

export function Titulo({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.h1}>{titulo}</Text>
      <Text style={s.sub}>{sub}</Text>
    </View>
  );
}

export function LinhaTabela({ children }: { children: React.ReactNode }) {
  return <View style={s.linha}>{children}</View>;
}

export function VazioTabela({ texto }: { texto: string }) {
  return <Text style={s.vazio}>{texto}</Text>;
}

const s = StyleSheet.create({
  rotulo: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  dica: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  h1: { color: '#fff', fontSize: 30, fontWeight: '700' },
  sub: { color: cores.textoSuave, marginTop: 4 },
  linha: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  vazio: { color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', paddingVertical: 12 },
});
