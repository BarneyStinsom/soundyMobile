// src/lib/curtidas.ts — playlist base "Músicas curtidas" (criada no cadastro, usada pelo coração do player)
import { api, ApiError } from '@/services/api';

export const NOME_CURTIDAS = 'Músicas curtidas';

type Playlist = { id: string; name: string };
type Item = { id: string; position: number; song?: { id: string } };

async function acharCurtidas(userId: string): Promise<string | null> {
  const minhas = await api<Playlist[]>(`/users/${userId}/playlists`);
  return (minhas ?? []).find((p) => p.name === NOME_CURTIDAS)?.id ?? null;
}

// Devolve o id da playlist de curtidas; se ela não existir (conta antiga, ou foi excluída), cria.
export async function garantirCurtidas(userId: string): Promise<string> {
  const existente = await acharCurtidas(userId);
  if (existente) return existente;

  const nova = await api<Playlist | null>('/playlists', {
    method: 'POST',
    body: JSON.stringify({ name: NOME_CURTIDAS, userId, isPublic: false }),
  });
  if (nova?.id) return nova.id;

  // se o backend não devolveu o id, busca de novo na lista
  const criada = await acharCurtidas(userId);
  if (!criada) throw new Error('Não foi possível criar a playlist de curtidas.');
  return criada;
}

// A API responde 404 quando a playlist existe mas está vazia
async function itensDa(playlistId: string): Promise<Item[]> {
  try {
    return (await api<Item[]>(`/playlists/${playlistId}/songs`)) ?? [];
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

// Diz se a música já está curtida (itemId vem preenchido) e em qual playlist.
export async function buscarCurtida(userId: string, songId: string) {
  const playlistId = await garantirCurtidas(userId);
  const itens = await itensDa(playlistId);
  const achou = itens.find((i) => i.song?.id === songId);
  return { playlistId, itemId: achou?.id ?? null };
}

export async function curtir(playlistId: string, songId: string): Promise<void> {
  const itens = await itensDa(playlistId);
  const position = itens.reduce((max, i) => Math.max(max, i.position), 0) + 1;
  await api('/playlistsongs', {
    method: 'POST',
    body: JSON.stringify({ playlistId, songId, position }),
  });
}

export async function descurtir(itemId: string): Promise<void> {
  await api(`/playlistsongs/${itemId}`, { method: 'DELETE' });
}