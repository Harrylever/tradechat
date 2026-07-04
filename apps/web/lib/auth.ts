import { cookies } from "next/headers"

export const COOKIE_NAME = "tradechat_token"

/** Read the JWT from the httpOnly cookie (server-side only) */
export async function getToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value ?? null
}

/** Decode the JWT payload WITHOUT verification (safe for display only) */
export function decodeJwt(token: string): {
  sub: string
  whatsappNumber: string
  exp: number
} | null {
  try {
    const parts = token.split(".")
    const payload = parts[1]
    if (!payload) return null
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    )
    return decoded
  } catch {
    return null
  }
}

/** Get the merchantId from the JWT cookie (server-side) */
export async function getMerchantId(): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  const payload = decodeJwt(token)
  if (!payload || payload.exp * 1000 < Date.now()) return null
  return payload.sub
}
