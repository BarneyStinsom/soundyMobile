// src/components/ui.tsx — peças visuais compartilhadas (mesmo estilo do front do PC)
import { cores } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator, Image, Modal, Pressable, StyleProp, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';

type Variante = 'primario' | 'contorno' | 'perigo' | 'rosa';

export function Botao({
  titulo, onPress, variante = 'contorno', pequeno, desabilitado, carregando, style,
}: {
  titulo: string; onPress: () => void; variante?: Variante; pequeno?: boolean;
  desabilitado?: boolean; carregando?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const v = estilosBotao[variante];
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado || carregando}
      style={[
        ui.botao, pequeno && ui.botaoPequeno, v.caixa,
        (desabilitado || carregando) && { opacity: 0.5 }, style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={v.texto} />
      ) : (
        <Text style={[ui.botaoTexto, pequeno && { fontSize: 13 }, { color: v.texto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilosBotao: Record<Variante, { caixa: ViewStyle; texto: string }> = {
  primario: { caixa: { backgroundColor: cores.verde, borderColor: cores.verde }, texto: '#000' },
  rosa: { caixa: { backgroundColor: cores.rosa, borderColor: cores.rosa }, texto: '#fff' },
  contorno: { caixa: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.3)' }, texto: '#fff' },
  perigo: { caixa: { backgroundColor: 'transparent', borderColor: cores.perigo }, texto: cores.perigo },
};

export function Campo({ rotulo, ...props }: { rotulo: string } & TextInputProps) {
  return (
    <View style={ui.campo}>
      <Text style={ui.rotulo}>{rotulo}</Text>
      <TextInput placeholderTextColor="rgba(255,255,255,0.4)" {...props} style={[ui.input, props.style]} />
    </View>
  );
}

// Equivalente ao <select>: abre uma lista para escolher
export function Seletor({
  rotulo, valor, opcoes, onChange, placeholder = 'Selecione...',
}: {
  rotulo: string; valor: string; opcoes: { valor: string; texto: string }[];
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.valor === valor);
  return (
    <View style={ui.campo}>
      <Text style={ui.rotulo}>{rotulo}</Text>
      <Pressable style={[ui.input, ui.seletor]} onPress={() => setAberto(true)}>
        <Text style={{ color: atual ? '#fff' : 'rgba(255,255,255,0.4)', flex: 1 }} numberOfLines={1}>
          {atual ? atual.texto : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#fff" />
      </Pressable>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={ui.fundoModal} onPress={() => setAberto(false)}>
          <View style={ui.listaSeletor}>
            <Text style={[ui.rotulo, { marginBottom: 8 }]}>{rotulo}</Text>
            {opcoes.length === 0 ? (
              <Text style={{ color: cores.textoSuave, paddingVertical: 12 }}>Nenhuma opção disponível</Text>
            ) : (
              opcoes.map((o) => (
                <Pressable
                  key={o.valor}
                  style={ui.opcao}
                  onPress={() => { onChange(o.valor); setAberto(false); }}
                >
                  <Text style={{ color: o.valor === valor ? cores.rosa : '#fff', fontWeight: o.valor === valor ? '700' : '400' }}>
                    {o.texto}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Painel({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <View style={ui.painel}>
      {titulo ? <Text style={ui.painelTitulo}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

// Imagem com ícone no lugar quando não há capa (ou quando ela não carrega)
export function Capa({
  uri, tamanho, redonda, icone = 'musical-notes', style,
}: {
  uri?: string | null; tamanho?: number; redonda?: boolean;
  icone?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle>;
}) {
  const [falhou, setFalhou] = useState(false);
  const base: ViewStyle = {
    ...(tamanho ? { width: tamanho, height: tamanho } : { width: '100%', aspectRatio: 1 }),
    borderRadius: redonda ? 999 : tamanho && tamanho < 60 ? 8 : 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <View style={[base, style]}>
      {uri && !falhou ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFalhou(true)} />
      ) : (
        <Ionicons name={icone} size={tamanho ? tamanho * 0.45 : 48} color={cores.rosa} />
      )}
    </View>
  );
}

export function Mensagem({ texto, tipo = 'info' }: { texto: string; tipo?: 'info' | 'erro' | 'sucesso' }) {
  if (!texto) return null;
  const cor = tipo === 'erro' ? cores.erro : tipo === 'sucesso' ? cores.verde : cores.textoSuave;
  return <Text style={{ color: cor, fontSize: 14, marginVertical: 6 }}>{texto}</Text>;
}

export const ui = StyleSheet.create({
  botao: {
    paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  botaoPequeno: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  botaoTexto: { fontWeight: '700', fontSize: 15 },
  campo: { marginBottom: 14 },
  rotulo: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, color: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  seletor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  listaSeletor: {
    backgroundColor: '#1a0210', borderRadius: 16, padding: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', maxHeight: '70%',
  },
  opcao: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  painel: {
    backgroundColor: cores.vidro, borderWidth: 1, borderColor: cores.vidroBorda,
    borderRadius: 16, padding: 16, marginBottom: 18,
  },
  painelTitulo: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
});
