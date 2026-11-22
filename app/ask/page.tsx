'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { Mochi } from '@/components/Mochi'

type Msg = { role: 'user' | 'assistant'; content: string }
const YARN = 'Mochi tripped over the yarn, try again 🧶'
const BEYOND = '📚 Beyond your notes'

// Pull "📚 Beyond your notes" lines out as a small label, render the rest as markdown.
function Answer({ text }: { text: string }) {
  const parts = text.split(/^(?=📚 Beyond your notes)/m)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith(BEYOND) ? (
          <div key={i}>
            <span className="inline-block rounded-full bg-chip px-2 py-0.5 text-xs font-bold text-brand">{BEYOND}</span>
            <Markdown text={p.slice(BEYOND.length).replace(/^[\s:—-]+/, '')} />
          </div>
        ) : (
          <Markdown key={i} text={p} />
        ),
      )}
    </>
  )
}

export default function Ask() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const q = input.trim()
    if (!q || busy) return
    const history: Msg[] = [...msgs, { role: 'user', content: q }]
    setMsgs([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    const set = (content: string) => setMsgs([...history, { role: 'assistant', content }])
    let acc = ''
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null)
        set(j?.error ?? YARN)
      } else {
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          acc += dec.decode(value, { stream: true })
          set(acc)
          end.current?.scrollIntoView({ block: 'end' })
        }
        if (!acc.trim()) set(YARN)
      }
    } catch {
      set(YARN)
    }
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Back" className="text-brand">‹</Link>
        <Mochi size={36} />
        <span className="text-xl font-extrabold text-brand">Ask Mochi</span>
      </div>
      <div className="flex-1 space-y-2">
        {msgs.length === 0 && <p className="py-6 text-center text-sm opacity-75">Ask about your notes, e.g. “What haven&apos;t I revised?” 🐾</p>}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-8 rounded-[14px] bg-accent px-3 py-2 text-sm'
                : 'mr-8 rounded-[14px] border-[1.5px] border-line bg-card px-3 py-2'
            }
          >
            {m.role === 'user' ? m.content : m.content ? <Answer text={m.content} /> : <span className="text-sm opacity-60">Mochi is thinking…</span>}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="sticky bottom-0 flex gap-2 bg-bg pb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={4000}
          placeholder="Ask Mochi…"
          className="min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-card px-4 py-2 text-sm"
        />
        <button disabled={busy || !input.trim()} className="rounded-full bg-accent px-4 py-2 text-sm font-bold disabled:opacity-50">
          Send
        </button>
      </form>
    </main>
  )
}
