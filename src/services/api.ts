// src/services/api.ts
export const API_URL = 'https://soundy-utye.onrender.com';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      // com FormData NÃO defina Content-Type: o fetch coloca o boundary sozinho
      headers: isForm ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // o NestJS devolve message como string ou array de strings
    const msg = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
    throw new ApiError(msg || `Erro ${response.status}`, response.status);
  }
  return data as T;
}
