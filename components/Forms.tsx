'use client'

import { useState, useTransition } from 'react'
import { CalendarDays } from 'lucide-react'
import { ICONS } from '@/lib/icons'
import { SUBJECT_LABELS, SubjectIcon } from '@/components/SubjectIcon'
import { useRouter } from 'next/navigation'
import { Sheet } from '@/components/Sheet'
import { createSubject, createTopic, createSubtopic, deleteSubject, deleteSubtopic, deleteTopic, renameTopic, updateSubject, updateSubtopic } from '@/app/actions'

const del = { subject: deleteSubject, topic: deleteTopic, subtopic: deleteSubtopic }

export const input = 'block min-h-11 w-full rounded-full border-[1.5px] border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent'
export const btn = 'min-h-11 rounded-full bg-accent px-4 py-2 text-sm font-bold text-on-accent disabled:opacity-50'

const TITLE = { subject: 'New subject', topic: 'New topic', subtopic: 'New sub-topic' }

type Kind = 'subject' | 'topic' | 'subtopic'

// State lives here (not in AddForm) so it resets each time the sheet unmounts.
function AddBody({ kind, parentId, close }: { kind: Kind; parentId?: string; close: () => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          if (kind === 'subject') await createSubject(name, icon)
          else if (kind === 'topic') await createTopic(parentId!, name)
          else await createSubtopic(parentId!, name)
          close()
        })
      }}
    >
      <input autoFocus required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" className={input} />
      {kind === 'subject' && (
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              aria-label={SUBJECT_LABELS[i]}
              aria-pressed={icon === i}
              onClick={() => setIcon(i)}
              className={`grid h-11 w-11 place-items-center rounded-[10px] ${icon === i ? 'bg-accent text-on-accent' : 'bg-chip'}`}
            >
              <SubjectIcon icon={i} size={20} />
            </button>
          ))}
        </div>
      )}
      <button disabled={pending || !name.trim()} className={`${btn} w-full`}>Add</button>
    </form>
  )
}

export function AddForm({ kind, parentId }: { kind: Kind; parentId?: string }) {
  return (
    <Sheet
      title={TITLE[kind]}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label={`Add ${kind === 'subtopic' ? 'sub-topic' : kind}`}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-20 grid h-12 min-w-12 place-items-center rounded-2xl bg-brand text-3xl text-on-accent shadow-fab"
        >
          +
        </button>
      )}
    >
      {(close) => <AddBody kind={kind} parentId={parentId} close={close} />}
    </Sheet>
  )
}

// "⋯" menu for a subject, topic or sub-topic: rename + delete.
type MenuProps = { kind: Kind; id: string; name: string; deleteMessage: string; to?: string }

function MenuBody({ kind, id, name, deleteMessage, to, close }: MenuProps & { close: () => void }) {
  const router = useRouter()
  const [v, setV] = useState(name)
  const [pending, start] = useTransition()
  return (
    <div className="space-y-3">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => {
            if (kind === 'topic') await renameTopic(id, v)
            else if (kind === 'subject') await updateSubject(id, { name: v })
            else await updateSubtopic(id, { name: v })
            close()
          })
        }}
      >
        <input autoFocus required maxLength={100} value={v} onChange={(e) => setV(e.target.value)} aria-label="New name" className={input} />
        <button disabled={pending || !v.trim()} className={`${btn} w-full`}>Save</button>
      </form>
      <button
        type="button"
        disabled={pending}
        className="min-h-11 w-full rounded-full border-[1.5px] border-line px-4 py-2 text-sm font-bold text-brand disabled:opacity-50"
        onClick={() => {
          if (!window.confirm(deleteMessage)) return
          start(async () => {
            // Leave a detail page before its item disappears, so it never flashes a 404.
            if (to) router.replace(to)
            await del[kind](id)
            close()
          })
        }}
      >
        Delete
      </button>
    </div>
  )
}

export function ItemMenu(p: MenuProps) {
  return (
    <Sheet
      title={p.name}
      trigger={(open) => (
        <button type="button" onClick={open} aria-label={`Options for ${p.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-full text-xl font-black text-brand">
          ⋯
        </button>
      )}
    >
      {(close) => <MenuBody {...p} close={close} />}
    </Sheet>
  )
}

export function ExamDate({ id, value }: { id: string; value: string | null }) {
  const [pending, start] = useTransition()
  const set = (d: string | null) =>
    start(async () => {
      await updateSubject(id, { exam_date: d })
    })
  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? 'opacity-60' : ''}`}>
      <label className="inline-flex items-center gap-1 text-sm font-bold" htmlFor="exam"><CalendarDays size={16} aria-hidden />Exam date</label>
      <input id="exam" type="date" key={value ?? ''} defaultValue={value ?? ''} onChange={(e) => e.target.value && set(e.target.value)} className="rounded-full border-[1.5px] border-line bg-card px-3 py-1.5 text-sm" />
      {value && (
        <button type="button" onClick={() => set(null)} className="rounded-full px-2 py-1 text-xs font-bold text-brand">
          Clear
        </button>
      )}
    </div>
  )
}
