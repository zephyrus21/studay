'use client'

import { useTransition } from 'react'
import { bumpRevision } from '@/app/actions'

export function ReviseButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className="min-h-11 min-w-11 shrink-0 rounded-full border-[1.2px] border-line bg-chip px-3 text-xs font-bold disabled:opacity-60"
      onClick={() =>
        start(async () => {
          if (await bumpRevision(id, 1)) window.dispatchEvent(new CustomEvent('studay:revised', { detail: { id, name } }))
        })
      }
    >
      +1
    </button>
  )
}
