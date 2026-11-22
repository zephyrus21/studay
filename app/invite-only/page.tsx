'use client'
import { PawPrint } from 'lucide-react'
import { Mochi } from '@/components/Mochi'
import { SignOut } from '@/components/SignOut'

export default function InviteOnly() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-bg p-6 text-ink">
      <Mochi size={120} />
      <h1 className="flex items-center gap-2 text-xl font-bold">Studay is invite-only<PawPrint size={20} aria-hidden /></h1>
      <SignOut />
    </main>
  )
}
