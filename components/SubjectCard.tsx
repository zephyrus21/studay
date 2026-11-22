import Link from 'next/link'
import { Repeat, House, School } from 'lucide-react'
import { countdown, percent } from '@/lib/progress'
import { CountdownIcon, SubjectIcon } from '@/components/SubjectIcon'
import type { Counts, Subject } from '@/lib/data'

const bars = [
  { label: 'Class', icon: School, key: 'classCount', color: 'bg-accent' },
  { label: 'Self', icon: House, key: 'selfCount', color: 'bg-self' },
  { label: 'Revised', icon: Repeat, key: 'revised', color: 'bg-revised' },
] as const

export function ProgressBars({ total, classCount, selfCount, revised }: { total: number; classCount: number; selfCount: number; revised: number }) {
  const counts = { classCount, selfCount, revised }
  return (
    <div className="mt-2 space-y-1 text-[11px] font-semibold">
      {bars.map(({ label, icon: Icon, key, color }) => {
        const pct = percent(counts[key], total)
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="flex w-[72px] shrink-0 items-center gap-1"><Icon size={12} aria-hidden />{label}</span>
            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-line">
              <i className={`block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-9 shrink-0 text-right">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

export function SubjectCard({ s, today }: { s: Subject & Counts; today: string }) {
  const cd = countdown(s.exam_date, today)
  return (
    <Link href={`/s/${s.id}`} className="block rounded-[20px] bg-card p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2 font-bold">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-chip"><SubjectIcon icon={s.icon} /></span>
          <span className="truncate">{s.name}</span>
        </span>
      </div>
      <div className="my-1.5 text-xs opacity-65">
        {s.done} of {s.total} sub-topics
      </div>
      <ProgressBars total={s.total} classCount={s.class_count} selfCount={s.self_count} revised={s.revised} />
      {cd && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span
            className={`inline-flex items-center gap-1 rounded-full border-[1.2px] border-accent px-2 py-0.5 font-bold ${cd.urgent ? 'bg-accent text-on-accent' : 'bg-card'}`}
          >
            <CountdownIcon today={cd.today} />
            {cd.label}
          </span>
        </div>
      )}
    </Link>
  )
}
