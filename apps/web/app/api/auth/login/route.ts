import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/auth"

/** POST /api/auth/login — receives { accessToken } from client, sets httpOnly cookie */
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json()

  if (!accessToken) {
    return NextResponse.json({ error: "Missing accessToken" }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}
