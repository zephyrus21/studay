import { auth } from '@/lib/auth/server'

export default auth.middleware({
  loginUrl: '/auth/sign-in',
  publicRoutes: ['/invite-only', '/manifest.webmanifest', '/api/ask'],
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webp)$).*)'],
}
