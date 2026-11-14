// src/lib/arquivos.ts — escolher e enviar imagem/áudio (equivalente aos <input type="file"> do site)
import { API_URL, ApiError } from '@/services/api';
import { createAudioPlayer } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type Arquivo = { uri: string; name: string; type: string; size?: number };

const MAX_IMAGEM = 5 * 1024 * 1024; // mesmo limite do backend

// Capas podem vir como link completo ou como caminho do backend ("/uploads/x.jpg")
export function imagemUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^(https?:|data:|blob:|file:)/i.test(url)) return url;
  return new URL(url, API_URL).href;
}

export async function escolherImagem(): Promise<Arquivo | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  if (a.fileSize && a.fileSize > MAX_IMAGEM) throw new Error('A imagem deve ter no máximo 5MB.');
  return {
    uri: a.uri,
    name: a.fileName || `imagem-${Date.now()}.jpg`,
    type: a.mimeType || 'image/jpeg',
    size: a.fileSize,
  };
}

export async function escolherAudio(): Promise<Arquivo | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, name: a.name, type: a.mimeType || 'audio/mpeg', size: a.size };
}

// Envia pro backend (multipart) e devolve a URL absoluta salva.
export async function enviarArquivo(tipo: 'image' | 'audio', arquivo: Arquivo): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(arquivo.uri)).blob();
    form.append('file', blob, arquivo.name);
  } else {
    form.append('file', { uri: arquivo.uri, name: arquivo.name, type: arquivo.type } as any);
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}/uploads/${tipo}`, { method: 'POST', body: form });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor para enviar o arquivo.', 0);
  }
  const texto = await resposta.text();
  let dados: any = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {}
  if (!resposta.ok) {
    const msg = Array.isArray(dados?.message) ? dados.message.join(' ') : dados?.message;
    throw new ApiError(msg || `Erro ${resposta.status} ao enviar o arquivo.`, resposta.status);
  }
  if (!dados?.url) throw new Error('O servidor não retornou a URL do arquivo.');
  return new URL(dados.url, API_URL).href;
}

// Lê a duração do áudio escolhido (o site faz isso com new Audio()). Devolve segundos ou null.
export async function lerDuracao(uri: string): Promise<number | null> {
  try {
    const player = createAudioPlayer({ uri });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (player.duration > 0) {
        const d = Math.round(player.duration);
        player.release();
        return d;
      }
    }
    player.release();
  } catch {}
  return null;
}
