'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { addTodoFromChat } from '@/app/actions'
import { fmt, KIND } from '@/components/Todos'
import type { Proposal } from '@/lib/proposal'

type State = 'idle' | 'pending' | 'added' | 'failed' | 'gone' | 'past' | 'dismissed'
const ALERTS: Partial<Record<State, string>> = {
  failed: 'Something went wrong, try again',
  gone: 'That sub-topic no longer exists',
  past: 'That date has passed',
}

// A to-do Mochi offered in chat. Nothing is created until the student taps Add.
export function TodoProposal({ p }: { p: Proposal }) {
  const [state, setState] = useState<State>('idle')
  if (state === 'dismissed') return null
  const { label, Icon } = KIND[p.kind]
  const name = `${p.subtopic_name}, ${label}, ${fmt(p.due)}`
  const add = async () => {
    setState('pending')
    try {
      const r = await addTodoFromChat(p.subtopic_id, p.kind, p.due)
      setState(r === 'past' ? 'past' : r === null ? 'gone' : 'added')
    } catch {
      setState('failed')
    }
  }
  return (
    <div className="mt-2 rounded-[14px] border-[1.5px] border-line bg-bg p-3">
      <div className="flex items-start gap-2">
        <ClipboardList size={18} aria-hidden className="mt-0.5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" title={p.subtopic_name}>
            {p.subtopic_name}
          </p>
          <p className="truncate text-xs opacity-60">{p.topic_name}</p>
          <p className="flex flex-wrap items-center gap-1.5 text-xs opacity-75">
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold">
              <Icon size={12} aria-hidden />
              {label}
            </span>
            <span>{fmt(p.due)}</span>
          </p>
        </div>
      </div>
      {state === 'added' ? (
        <p role="status" className="pt-2 text-sm font-bold">
          Added to your to-dos ✓{' '}
          <Link href="/todo" className="text-brand underline">
            View
          </Link>
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {state !== 'gone' && state !== 'past' && (
            <button
              type="button"
              onClick={add}
              disabled={state === 'pending'}
              aria-label={`Add ${name}`}
              className="min-h-11 rounded-full bg-accent px-4 py-2 text-sm font-bold text-on-accent disabled:opacity-50"
            >
              Add
            </button>
          )}
          <button
            type="button"
            onClick={() => setState('dismissed')}
            disabled={state === 'pending'}
            aria-label={`Dismiss ${name}`}
            className="min-h-11 rounded-full border-[1.5px] border-line px-4 py-2 text-sm font-bold text-brand disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      )}
      {ALERTS[state] && (
        <p role="alert" className="pt-1 text-sm text-brand">
          {ALERTS[state]}
        </p>
      )}
    </div>
  )
}
