'use client'
import { authClient } from '@/lib/auth/client'

export function SignOut({ className = '' }: { className?: string }) {
  return (
    <button
      className={`rounded-xl border border-line bg-card px-6 py-3 font-bold ${className}`}
      onClick={() => authClient.signOut().then(() => (window.location.href = '/auth/sign-in'))}
    >
      Sign out
    </button>
  )
}
