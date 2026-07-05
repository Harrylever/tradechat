import { cookies } from 'next/headers'

export const ACCESS_TOKEN_COOKIE_NAME = 'tradechat_token'

/** Read the JWT from the httpOnly cookie (server-side only) */
export async function getToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null
}
