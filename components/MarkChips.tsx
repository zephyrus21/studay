'use client'

import { useTransition } from 'react'
import { bumpRevision, updateSubtopic } from '@/app/actions'

const chip = (on: boolean) =>
  `rounded-full border-[1.2px] px-2.5 py-1 text-xs font-bold ${on ? 'border-accent bg-accent text-white' : 'border-line bg-chip'}`

export function MarkChips({
  id,
  inClass,
  selfStudy,
  canUndo = false,
  revisions = 0,
}: {
  id: string
  inClass: boolean
  selfStudy: boolean
  canUndo?: boolean
  revisions?: number
}) {
  const [pending, start] = useTransition()
  const run = (p: () => Promise<unknown>) => start(async () => void (await p()))
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${pending ? 'opacity-60' : ''}`}>
      <button type="button" aria-pressed={inClass} className={chip(inClass)} onClick={() => run(() => updateSubtopic(id, { in_class: !inClass }))}>
        🏫 Class
      </button>
      <button type="button" aria-pressed={selfStudy} className={chip(selfStudy)} onClick={() => run(() => updateSubtopic(id, { self_study: !selfStudy }))}>
        🏠 Self
      </button>
      <button type="button" className={chip(false)} onClick={() => run(() => bumpRevision(id, 1))}>
        +1 revision
      </button>
      {canUndo && (
        <button type="button" disabled={revisions === 0} className={`${chip(false)} disabled:opacity-40`} onClick={() => run(() => bumpRevision(id, -1))}>
          −1
        </button>
      )}
    </div>
  )
}
