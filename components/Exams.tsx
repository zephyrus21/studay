'use client'

import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { createExam, deleteExam, updateExam } from '@/app/actions'
import { btn, input } from '@/components/Forms'
import { CountdownIcon } from '@/components/SubjectIcon'
import { Sheet } from '@/components/Sheet'
import type { Exam } from '@/lib/data'
import { daysUntil } from '@/lib/progress'

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })

export function Exams({ subjectId, exams, today }: { subjectId: string; exams: Exam[]; today: string }) {
  const upcoming = exams.filter((e) => e.date >= today)
  const past = exams.filter((e) => e.date < today).reverse()
  return (
    <details className="group rounded-[20px] bg-card px-3.5 shadow-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-[20px] font-bold focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <span className="flex-1">Exams</span>
        <span aria-hidden="true" className="rounded-full bg-chip px-2 text-[11px]">{exams.length}</span>
        <span className="sr-only">{exams.length} exams</span>
        <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 pb-3.5">
      {exams.length === 0 && <p className="text-sm opacity-65">No exams yet.</p>}
      {upcoming.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase opacity-65">Upcoming</p>
          <ul className="divide-y divide-line">
            {upcoming.map((e) => {
              const n = daysUntil(e.date, today)
              return (
                <li key={e.id} className="flex items-center gap-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate font-bold">{e.name}</span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border-[1.2px] border-accent px-2 py-0.5 text-[11px] font-bold ${n <= 7 ? 'bg-accent text-on-accent' : 'bg-card'}`}>
                    <CountdownIcon today={n === 0} />
                    {n === 0 ? 'today' : n === 1 ? 'in 1 day' : `in ${n} days`}
                  </span>
                  <ExamMenu exam={e} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase opacity-65">Past</p>
          <ul className="divide-y divide-line">
            {past.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-1.5 opacity-65">
                <span className="min-w-0 flex-1 truncate">{e.name}</span>
                <span className="shrink-0 text-xs">{fmt(e.date)}</span>
                <ExamMenu exam={e} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <Sheet
        title="New exam"
        trigger={(open) => (
          <button type="button" onClick={open} className="min-h-11 w-full rounded-full border-[1.5px] border-line px-4 py-2 text-sm font-bold text-brand">
            + Add exam
          </button>
        )}
      >
        {(close) => <AddExamBody subjectId={subjectId} close={close} />}
      </Sheet>
      </div>
    </details>
  )
}

function AddExamBody({ subjectId, close }: { subjectId: string; close: () => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        setFailed(false)
        start(async () => {
          try {
            await createExam(subjectId, name, date)
            close()
          } catch {
            setFailed(true)
          }
        })
      }}
    >
      <input autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Exam name" className={input} />
      <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Exam date" className={input} />
      {failed && <p role="alert" className="text-sm text-brand">Something went wrong, try again</p>}
      <button disabled={pending || !name.trim() || !date} className={`${btn} w-full`}>Add</button>
    </form>
  )
}

function ExamMenu({ exam }: { exam: Exam }) {
  return (
    <Sheet
      title={exam.name}
      trigger={(open) => (
        <button type="button" onClick={open} aria-label={`Options for ${exam.name}`} className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full text-xl font-black text-brand">
          ⋯
        </button>
      )}
    >
      {(close) => <ExamEditBody exam={exam} close={close} />}
    </Sheet>
  )
}

function ExamEditBody({ exam, close }: { exam: Exam; close: () => void }) {
  const [name, setName] = useState(exam.name)
  const [date, setDate] = useState(exam.date)
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  return (
    <div className="space-y-3">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          setFailed(false)
          start(async () => {
            try {
              await updateExam(exam.id, { name, date })
              close()
            } catch {
              setFailed(true)
            }
          })
        }}
      >
        <input autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} aria-label="Exam name" className={input} />
        <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Exam date" className={input} />
        {failed && <p role="alert" className="text-sm text-brand">Something went wrong, try again</p>}
        <button disabled={pending || !name.trim() || !date} className={`${btn} w-full`}>Save</button>
      </form>
      <button
        type="button"
        disabled={pending}
        className="min-h-11 w-full rounded-full border-[1.5px] border-line px-4 py-2 text-sm font-bold text-brand disabled:opacity-50"
        onClick={() => {
          if (!window.confirm(`Delete ${exam.name}?`)) return
          setFailed(false)
          start(async () => {
            try {
              await deleteExam(exam.id)
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
