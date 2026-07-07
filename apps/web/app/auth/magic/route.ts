import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { api } from '@/lib/api'
import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=missing_token', request.url),
    )
  }

  try {
    const res = await api.post<{ accessToken: string }>('/auth/magic/consume', {
      token,
    })

    const store = await cookies()
    store.set(ACCESS_TOKEN_COOKIE_NAME, res.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Magic link consumption failed:', error)
    return NextResponse.redirect(
      new URL('/login?error=invalid_or_expired_token', request.url),
    )
  }
}
