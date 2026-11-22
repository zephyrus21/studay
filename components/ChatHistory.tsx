'use client'

import { useState } from 'react'
import { History, Trash2 } from 'lucide-react'
import { listChats, removeChat } from '@/app/actions'
import { Sheet } from '@/components/Sheet'
import type { ChatSummary } from '@/lib/data'

const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export function ChatHistory({ chats, currentId }: { chats: ChatSummary[]; currentId: string | null }) {
  const [list, setList] = useState(chats)
  const [cur, setCur] = useState(currentId)

  function show(open: () => void) {
    open()
    // The URL may have changed via replaceState after a new chat's first answer.
    setCur(new URLSearchParams(location.search).get('c'))
    listChats().then(setList).catch(() => {})
  }

  async function remove(c: ChatSummary) {
    if (!window.confirm(`Delete ${c.title}?`)) return
    await removeChat(c.id)
    if (c.id === new URLSearchParams(location.search).get('c')) location.assign('/ask')
    else setList((l) => l.filter((x) => x.id !== c.id))
  }

  return (
    <Sheet
      title="Chat history"
      trigger={(open) => (
        <button type="button" onClick={() => show(open)} aria-label="History" className="grid min-h-11 min-w-11 place-items-center rounded-full text-brand">
          <History size={22} aria-hidden />
        </button>
      )}
    >
      {() =>
        list.length === 0 ? (
          <p className="py-6 text-center text-sm opacity-75">No saved chats yet</p>
        ) : (
          <ul className="space-y-2 pb-2">
            {list.map((c) => (
              <li key={c.id} className={`flex items-center gap-1 rounded-[14px] ${c.id === cur ? 'bg-chip' : ''}`}>
                <a href={`/ask?c=${c.id}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center px-3 py-2">
                  <span className="truncate text-sm font-bold">{c.title}</span>
                  <span className="text-xs opacity-75">{fmt.format(new Date(c.updated_at))}</span>
                </a>
                <button type="button" onClick={() => remove(c)} aria-label={`Delete ${c.title}`} className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full text-brand">
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )
      }
    </Sheet>
  )
}
