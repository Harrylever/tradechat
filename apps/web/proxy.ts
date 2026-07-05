import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth'

const publicPaths = ['/', '/login']

export function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const pathname = request.nextUrl.pathname

  const isPublicPath = publicPaths.some((path) => pathname === path)

  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes: redirect already authenticated users away from /login
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|error-monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
