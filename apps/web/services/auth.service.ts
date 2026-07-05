'use server'

import { cookies } from 'next/headers'

import { api } from '@/lib/api'
import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth'

export async function requestOtp(whatsappNumber: string) {
  return api.post<{ message: string }>('/auth/otp/request', {
    whatsappNumber,
  })
}

export async function verifyOtp(whatsappNumber: string, otp: string) {
  const res = await api.post<{ accessToken: string }>('/auth/otp/verify', {
    whatsappNumber,
    otp,
  })

  const store = await cookies()
  store.set(ACCESS_TOKEN_COOKIE_NAME, res.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return { success: true }
}
