import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth'

const publicPathPrefixes = ['/login', '/get-started', '/auth']
const exactPublicPaths = ['/']

function isPublic(pathname: string): boolean {
  return (
    exactPublicPaths.includes(pathname) ||
    publicPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  )
}
export function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const pathname = request.nextUrl.pathname
  const isPublicRoute = isPublic(pathname)

  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next|api|error-monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
