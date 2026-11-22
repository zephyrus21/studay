'use client'

import { useState, useTransition } from 'react'
import { ICONS } from '@/lib/icons'
import { createSubject, createTopic, createSubtopic, renameTopic, updateSubject, updateSubtopic } from '@/app/actions'

const input = 'min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent'
const btn = 'rounded-full bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50'

export function AddForm({ kind, parentId }: { kind: 'subject' | 'topic' | 'subtopic'; parentId?: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [pending, start] = useTransition()
  const label = `+ Add ${kind === 'subtopic' ? 'sub-topic' : kind}`
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btn} mx-auto block px-5`}>
        {label}
      </button>
    )
  return (
    <form
      className="space-y-2 rounded-[18px] border-[1.5px] border-dashed border-accent bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          if (kind === 'subject') await createSubject(name, icon)
          else if (kind === 'topic') await createTopic(parentId!, name)
          else await createSubtopic(parentId!, name)
          setName('')
          setOpen(false)
        })
      }}
    >
      {kind === 'subject' && (
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={icon === i}
              onClick={() => setIcon(i)}
              className={`grid h-9 w-9 place-items-center rounded-[10px] text-lg ${icon === i ? 'bg-accent' : 'bg-chip'}`}
            >
              {i}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input autoFocus required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" className={input} />
        <button disabled={pending || !name.trim()} className={btn}>Add</button>
      </div>
    </form>
  )
}

// Inline rename for a topic, sub-topic or subject.
export function RenameForm({ kind, id, name }: { kind: 'subject' | 'topic' | 'subtopic'; id: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState(name)
  const [pending, start] = useTransition()
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full px-2 py-1 text-xs font-bold text-brand">
        Rename
      </button>
    )
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          if (kind === 'topic') await renameTopic(id, v)
          else if (kind === 'subject') await updateSubject(id, { name: v })
          else await updateSubtopic(id, { name: v })
          setOpen(false)
        })
      }}
    >
      <input autoFocus required maxLength={100} value={v} onChange={(e) => setV(e.target.value)} aria-label="New name" className={input} />
      <button disabled={pending || !v.trim()} className={btn}>Save</button>
    </form>
  )
}

export function ExamDate({ id, value }: { id: string; value: string | null }) {
  const [pending, start] = useTransition()
  const set = (d: string | null) =>
    start(async () => {
      await updateSubject(id, { exam_date: d })
    })
  return (
    <div className={`flex items-center gap-2 ${pending ? 'opacity-60' : ''}`}>
      <label className="text-sm font-bold" htmlFor="exam">🗓 Exam date</label>
      <input id="exam" type="date" key={value ?? ''} defaultValue={value ?? ''} onChange={(e) => e.target.value && set(e.target.value)} className="rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-sm" />
      {value && (
        <button type="button" onClick={() => set(null)} className="rounded-full px-2 py-1 text-xs font-bold text-brand">
          Clear
        </button>
      )}
    </div>
  )
}
