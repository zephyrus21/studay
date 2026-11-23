'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Check, ChevronDown, Clock, Flag, House, Repeat, School, type LucideIcon } from 'lucide-react'
import { addTodo, editTodo, removeTodo, toggleTodo } from '@/app/actions'
import { btn, input } from '@/components/Forms'
import { Mochi } from '@/components/Mochi'
import { Sheet } from '@/components/Sheet'
import type { getPickList, TodoKind, TodoRow } from '@/lib/data'
import { fmtTime, PRIORITY } from '@/lib/todo-time'

type Pick = Awaited<ReturnType<typeof getPickList>>[number]

export const KIND: Record<TodoKind, { label: string; Icon: LucideIcon }> = {
  class: { label: 'Class', Icon: School },
  self: { label: 'Self', Icon: House },
  revise: { label: 'Revise', Icon: Repeat },
}

export const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const addDays = (d: string, n: number) => {
  const x = new Date(d + 'T00:00:00Z')
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
const failMsg = <p role="alert" className="text-sm text-brand">Something went wrong, try again</p>

type Prio = keyof typeof PRIORITY
const PRIOS: { key: Prio; label: string }[] = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]
const PRIO_OF: Record<1 | 2 | 3, Prio> = { 1: 'high', 2: 'medium', 3: 'low' }

// Time text plus priority badge; Medium with no time shows nothing.
export function TimePriority({ start, end, priority }: { start?: string | null; end?: string | null; priority: 1 | 2 | 3 }) {
  return (
    <>
      {start && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <Clock size={12} aria-hidden />
          {fmtTime(start, end)}
        </span>
      )}
      {priority === PRIORITY.high && (
        <span className="inline-flex shrink-0 items-center gap-1 font-bold text-brand">
          <Flag size={12} aria-hidden />
          High
        </span>
      )}
      {priority === PRIORITY.low && <span className="shrink-0 font-bold">Low</span>}
    </>
  )
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-end gap-1">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold">
        {label}
        <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className={input} />
      </label>
      <button type="button" onClick={() => onChange('')} aria-label={`Clear ${label.toLowerCase()} time`} disabled={!value} className="min-h-11 shrink-0 px-1 text-sm font-bold text-brand disabled:opacity-50">
        Clear
      </button>
    </div>
  )
}

function PriorityPicker({ value, onChange }: { value: Prio; onChange: (p: Prio) => void }) {
  return (
    <div role="group" aria-label="Priority" className="flex gap-1.5">
      {PRIOS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-full border-[1.5px] px-3 text-sm font-bold ${value === key ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Todos({ todos, picks, today }: { todos: TodoRow[]; picks: Pick[]; today: string }) {
  const tomorrow = addDays(today, 1)
  const open = todos.filter((t) => !t.done_at)
  const later = open.filter((t) => t.due > tomorrow)
  const laterDates = [...new Set(later.map((t) => t.due))]
  const done = todos
    .filter((t) => t.done_at)
    .sort((a, b) => new Date(b.done_at!).getTime() - new Date(a.done_at!).getTime())
    .slice(0, 30)
  return (
    <>
      {todos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Mochi size={96} />
          <p className="font-bold">Nothing planned yet</p>
        </div>
      )}
      <List title="Overdue" tone="text-brand" list={open.filter((t) => t.due < today)} />
      <List title="Today" list={open.filter((t) => t.due === today)} />
      <List title="Tomorrow" list={open.filter((t) => t.due === tomorrow)} />
      {laterDates.length > 0 && <h2 className="px-1 text-[11px] font-bold uppercase opacity-65">Later</h2>}
      {laterDates.map((d) => (
        <List key={d} title={fmt(d)} list={later.filter((t) => t.due === d)} />
      ))}
      {done.length > 0 && (
        <details className="group rounded-[20px] bg-card px-3.5 shadow-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-[20px] font-bold focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
            <span className="flex-1">Done</span>
            <span aria-hidden="true" className="rounded-full bg-chip px-2 text-[11px]">{done.length}</span>
            <span className="sr-only">{done.length} done</span>
            <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="divide-y divide-line pb-1.5">
            {done.map((t) => <TodoItem key={t.id} todo={t} />)}
          </ul>
        </details>
      )}
      <Sheet
        title="New to-do"
        trigger={(show) => (
          <button
            type="button"
            onClick={show}
            aria-label="Add to-do"
            className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-20 grid h-12 min-w-12 place-items-center rounded-2xl bg-brand text-3xl text-on-accent shadow-fab"
          >
            +
          </button>
        )}
      >
        {(close) => <AddBody picks={picks} today={today} close={close} />}
      </Sheet>
    </>
  )
}

function List({ title, tone, list }: { title: string; tone?: string; list: TodoRow[] }) {
  if (list.length === 0) return null
  return (
    <section className="space-y-1">
      <h2 className={`px-1 text-[11px] font-bold uppercase ${tone ?? 'opacity-65'}`}>{title}</h2>
      <ul className="divide-y divide-line rounded-[20px] bg-card px-3.5 shadow-card">
        {list.map((t) => <TodoItem key={t.id} todo={t} />)}
      </ul>
    </section>
  )
}

function TodoItem({ todo }: { todo: TodoRow }) {
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  const isDone = !!todo.done_at
  const { label, Icon } = KIND[todo.kind]
  return (
    <li className="py-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={`Done: ${todo.subtopic_name}, ${label}`}
          disabled={pending}
          onClick={() => {
            setFailed(false)
            start(async () => {
              try {
                await toggleTodo(todo.id, !isDone)
              } catch {
                setFailed(true)
              }
            })
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-[1.5px] border-accent disabled:opacity-50 ${isDone ? 'bg-accent text-on-accent' : 'bg-card'}`}
        >
          {isDone && <Check size={20} aria-hidden />}
        </button>
        <div className={`min-w-0 flex-1 ${isDone ? 'opacity-65' : ''}`}>
          <p className={`truncate font-bold ${isDone ? 'line-through' : todo.priority === PRIORITY.low ? 'opacity-70' : ''}`}>
            <Link href={`/n/${todo.subtopic_id}`} className="hover:underline">{todo.subtopic_name}</Link>
          </p>
          <p className="flex items-center gap-1.5 text-xs opacity-75">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold">
              <Icon size={12} aria-hidden />
              {label}
            </span>
            <TimePriority start={todo.start_time} end={todo.end_time} priority={todo.priority} />
            <span className="min-w-0 truncate">{todo.subject_name} › {todo.topic_name}</span>
          </p>
        </div>
        <TodoMenu todo={todo} />
      </div>
      {failed && <div className="pt-1">{failMsg}</div>}
    </li>
  )
}

function TodoMenu({ todo }: { todo: TodoRow }) {
  return (
    <Sheet
      title={todo.subtopic_name}
      trigger={(open) => (
        <button type="button" onClick={open} aria-label={`Options for ${todo.subtopic_name}`} className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full text-xl font-black text-brand">
          ⋯
        </button>
      )}
    >
      {(close) => <TodoEditBody todo={todo} close={close} />}
    </Sheet>
  )
}

function TodoEditBody({ todo, close }: { todo: TodoRow; close: () => void }) {
  const [due, setDue] = useState(todo.due)
  const [startTime, setStartTime] = useState(todo.start_time ?? '')
  const [endTime, setEndTime] = useState(todo.end_time ?? '')
  const [prio, setPrio] = useState<Prio>(PRIO_OF[todo.priority])
  const [err, setErr] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  return (
    <div className="space-y-3">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          setFailed(false)
          setErr(null)
          start(async () => {
            try {
              const r = await editTodo(todo.id, { due, start: startTime, end: endTime, priority: PRIORITY[prio] })
              if (r.error) setErr(r.error)
              else close()
            } catch {
              setFailed(true)
            }
          })
        }}
      >
        <input required type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className={input} />
        <div className="flex gap-2">
          <TimeField label="Start" value={startTime} onChange={setStartTime} />
          <TimeField label="End" value={endTime} onChange={setEndTime} />
        </div>
        <PriorityPicker value={prio} onChange={setPrio} />
        {err && <p role="alert" className="text-sm text-brand">{err}</p>}
        {failed && failMsg}
        <button disabled={pending || !due} className={`${btn} w-full`}>Save</button>
      </form>
      <button
        type="button"
        disabled={pending}
        className="min-h-11 w-full rounded-full border-[1.5px] border-line px-4 py-2 text-sm font-bold text-brand disabled:opacity-50"
        onClick={() => {
          if (!window.confirm(`Delete ${todo.subtopic_name}?`)) return
          setFailed(false)
          start(async () => {
            try {
              await removeTodo(todo.id)
              close()
            } catch {
              setFailed(true)
            }
          })
        }}
      >
        Delete
      </button>
    </div>
  )
}

function AddBody({ picks, today, close }: { picks: Pick[]; today: string; close: () => void }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Pick | null>(null)
  const [kind, setKind] = useState<TodoKind>('class')
  const [due, setDue] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [prio, setPrio] = useState<Prio>('medium')
  const [err, setErr] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  const needle = q.trim().toLowerCase()
  const hits = picks
    .filter((p) => [p.name, p.topic_name, p.subject_name].some((v) => v.toLowerCase().includes(needle)))
    .slice(0, 50)
  // Default kind: Class for a sub-topic with no marks yet, otherwise Revise.
  const choose = (p: Pick) => {
    setPicked(p)
    setKind(p.in_class || p.self_study ? 'revise' : 'class')
  }
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!picked) return
        setFailed(false)
        setErr(null)
        start(async () => {
          try {
            const r = await addTodo(picked.id, kind, due, startTime, endTime, PRIORITY[prio])
            if (r.error) setErr(r.error)
            else close()
          } catch {
            setFailed(true)
          }
        })
      }}
    >
      <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sub-topics" aria-label="Search sub-topics" className={input} />
      <ul className="max-h-56 divide-y divide-line overflow-y-auto">
        {hits.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              aria-pressed={picked?.id === p.id}
              onClick={() => choose(p)}
              className={`flex min-h-11 w-full flex-col items-start rounded-[10px] px-2 py-1.5 text-left ${picked?.id === p.id ? 'bg-chip' : ''}`}
            >
              <span className="font-bold">{p.name}</span>
              <span className="text-xs opacity-65">{p.subject_name} › {p.topic_name}</span>
            </button>
          </li>
        ))}
      </ul>
      {hits.length === 0 && <p className="text-sm opacity-65">{picks.length === 0 ? 'Add a sub-topic first' : 'No sub-topics match.'}</p>}
      {picked && (
        <>
          <p className="truncate text-sm font-bold">Selected: {picked.name}</p>
          <div className="flex gap-1.5">
            {(Object.keys(KIND) as TodoKind[]).map((k) => {
              const { label, Icon } = KIND[k]
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border-[1.5px] px-3 text-sm font-bold ${kind === k ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}
                >
                  <Icon size={16} aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
          <input required type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className={input} />
          <div className="flex gap-2">
            <TimeField label="Start" value={startTime} onChange={setStartTime} />
            <TimeField label="End" value={endTime} onChange={setEndTime} />
          </div>
          <PriorityPicker value={prio} onChange={setPrio} />
        </>
      )}
      {err && <p role="alert" className="text-sm text-brand">{err}</p>}
      {failed && failMsg}
      <button disabled={pending || !picked || !due} className={`${btn} w-full`}>Add</button>
    </form>
  )
}
