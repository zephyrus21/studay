'use client'

import { useEffect, useRef, useState } from 'react'
import { bumpRevision } from '@/app/actions'

type Revised = { id: string; name: string }

export function UndoBar() {
  const [last, setLast] = useState<Revised | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const onRevised = (e: Event) => {
      clearTimeout(timer.current)
      setLast((e as CustomEvent<Revised>).detail)
      timer.current = setTimeout(() => setLast(null), 5000)
    }
    window.addEventListener('studay:revised', onRevised)
    return () => {
      window.removeEventListener('studay:revised', onRevised)
      clearTimeout(timer.current)
    }
  }, [])

  return (
    <div role="status" aria-live="polite">
      {last && (
        <div className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-full bg-ink px-4 min-h-11 text-bg">
          <span className="min-w-0 flex-1 truncate">Revised {last.name}</span>
          <button
            type="button"
            className="min-h-11 min-w-11 shrink-0 px-2 font-bold text-bg underline"
            onClick={() => {
              clearTimeout(timer.current)
              setLast(null)
              bumpRevision(last.id, -1).catch(() => {})
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
