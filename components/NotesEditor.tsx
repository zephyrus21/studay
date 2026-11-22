'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateSubtopic } from '@/app/actions'
import { Markdown } from './Markdown'

export function NotesEditor({ id, initial }: { id: string; initial: string }) {
  const [text, setText] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [pending, start] = useTransition()
  const [failed, setFailed] = useState(false)
  const dirty = text !== saved

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    const leave = (e: MouseEvent) => {
      if ((e.target as Element).closest?.('a[href]') && !confirm('Discard unsaved notes?')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', leave, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', leave, true)
    }
  }, [dirty])

  const tabCls = (on: boolean) => `rounded-full px-3 py-1 text-xs font-bold ${on ? 'bg-accent text-white' : 'bg-chip'}`
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <button type="button" className={tabCls(tab === 'write')} onClick={() => setTab('write')}>Write</button>
        <button type="button" className={tabCls(tab === 'preview')} onClick={() => setTab('preview')}>Preview</button>
        <span className="ml-auto text-xs opacity-65">{dirty ? 'Unsaved changes' : 'Saved'}</span>
      </div>
      {tab === 'write' ? (
        <textarea
          value={text}
          maxLength={20000}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write notes in Markdown..."
          className="h-64 w-full rounded-[18px] border-[1.5px] border-line bg-card p-3 text-sm outline-none focus:border-accent"
        />
      ) : (
        <div className="min-h-32 rounded-[18px] border-[1.5px] border-line bg-card p-3">
          {text ? <Markdown text={text} /> : <p className="text-sm opacity-65">Nothing to preview yet.</p>}
        </div>
      )}
      <button
        type="button"
        disabled={!dirty || pending}
        className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            try {
              await updateSubtopic(id, { notes: text })
              setSaved(text)
              setFailed(false)
            } catch {
              setFailed(true)
            }
          })
        }
      >
        {pending ? 'Saving...' : 'Save notes'}
      </button>
      {failed && <p role="alert" className="text-xs font-bold text-brand">Save failed — try again</p>}
    </div>
  )
}
