import { getToken } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function request<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, ...rest } = options
  const token = (await getToken()) ?? undefined

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers ?? {}),
  }

  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...rest,
    headers,
    ...(body !== undefined
      ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
      : {}),
  })

  if (!res.ok) {
    let message = `API error ${res.status}`
    try {
      const errBody = await res.json()
      message = errBody?.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body: unknown, options?: ApiOptions) =>
    request<T>(path, { method: 'POST', body, ...options }),

  patch: <T>(path: string, body: unknown, options?: ApiOptions) =>
    request<T>(path, { method: 'PATCH', body, ...options }),

  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { method: 'DELETE', ...options }),
}
