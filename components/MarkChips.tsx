'use client'

import { useTransition } from 'react'
import { School, House } from 'lucide-react'
import { bumpRevision, updateSubtopic } from '@/app/actions'

const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center gap-1 rounded-full border-[1.2px] px-3 text-xs font-bold ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-chip'}`

export function MarkChips({ id, inClass, selfStudy }: { id: string; inClass: boolean; selfStudy: boolean }) {
  const [pending, start] = useTransition()
  const run = (p: () => Promise<unknown>) => start(async () => void (await p()))
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${pending ? 'opacity-60' : ''}`}>
      <button type="button" disabled={pending} aria-pressed={inClass} className={`${chip(inClass)} disabled:opacity-60`} onClick={() => run(() => updateSubtopic(id, { in_class: !inClass }))}>
        <School size={14} aria-hidden />
        Class
      </button>
      <button type="button" disabled={pending} aria-pressed={selfStudy} className={`${chip(selfStudy)} disabled:opacity-60`} onClick={() => run(() => updateSubtopic(id, { self_study: !selfStudy }))}>
        <House size={14} aria-hidden />
        Self
      </button>
      <button type="button" disabled={pending} className={`${chip(false)} disabled:opacity-60`} onClick={() => run(() => bumpRevision(id, 1))}>
        +1 revision
      </button>
    </div>
  )
}
