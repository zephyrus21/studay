import Link from 'next/link'
import { Repeat, House, School } from 'lucide-react'
import { countdown, percent } from '@/lib/progress'
import { CountdownIcon, SubjectIcon } from '@/components/SubjectIcon'
import type { Counts, Subject } from '@/lib/data'

export function Bar({ value }: { value: number }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-full bg-line">
      <i className="block h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
    </div>
  )
}

export function SubjectCard({ s, today }: { s: Subject & Counts; today: string }) {
  const pct = percent(s.done, s.total)
  const cd = countdown(s.exam_date, today)
  return (
    <Link href={`/s/${s.id}`} className="block rounded-[20px] bg-card p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2 font-bold">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-chip"><SubjectIcon icon={s.icon} /></span>
          <span className="truncate">{s.name}</span>
        </span>
        <span>{pct}%</span>
      </div>
      <div className="my-1.5 text-xs opacity-65">
        {s.done} of {s.total} sub-topics
      </div>
      <Bar value={pct} />
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5"><School size={12} aria-hidden />Class {s.class_count}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5"><House size={12} aria-hidden />Self {s.self_count}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5"><Repeat size={12} aria-hidden />Rev {s.revisions}×</span>
        {cd && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border-[1.2px] border-accent px-2 py-0.5 font-bold ${cd.urgent ? 'bg-accent text-on-accent' : 'bg-card'}`}
          >
            <CountdownIcon today={cd.today} />
            {cd.label}
          </span>
        )}
      </div>
    </Link>
  )
}
