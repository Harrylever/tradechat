import { cookies, headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'

import { ACCESS_TOKEN_COOKIE_NAME, getToken } from '@/lib/auth'

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
    if (res.status === 401) {
      const isAuthApi = path.startsWith('/auth/')
      let isPublicRoute = false

      try {
        const headersList = await getHeaders()
        const pathname = headersList.get('x-pathname') ?? ''

        isPublicRoute =
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/get-started') ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/payment')
      } catch {
        // In case headers() fails in some context
      }

      if (!isAuthApi && !isPublicRoute) {
        try {
          const store = await cookies()
          store.delete(ACCESS_TOKEN_COOKIE_NAME)
        } catch {
          // cookies().delete() is read-only during Server Component rendering,
          // but works in Server Actions and Route Handlers.
        }
        redirect('/login')
      }
    }

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
