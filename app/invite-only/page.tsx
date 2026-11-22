'use client'
import { Mochi } from '@/components/Mochi'
import { authClient } from '@/lib/auth/client'

export default function InviteOnly() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-bg p-6 text-ink">
      <Mochi size={120} />
      <h1 className="text-xl font-bold">Studay is invite-only 🐾</h1>
      <button
        className="rounded-xl border border-line bg-card px-6 py-3 font-bold"
        onClick={() => authClient.signOut().then(() => (window.location.href = '/auth/sign-in'))}
      >
        Sign out
      </button>
    </main>
  )
}
