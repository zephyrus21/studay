import Link from 'next/link'
import { Mochi } from '@/components/Mochi'
import { PageHeader } from '@/components/PageHeader'
import { ReviseButton } from '@/components/ReviseButton'
import { getRevise } from '@/lib/data'
import { countdown, sortSubjects } from '@/lib/progress'
import { requireUser, today } from '@/lib/session'

export default async function Revise() {
  const user = await requireUser()
  const [rows, day] = await Promise.all([getRevise(user.id), today()])
  const groups = new Map<string, { id: string; icon: string; name: string; exam_date: string | null; created_at: Date; rows: typeof rows }>()
  for (const r of rows) {
    let g = groups.get(r.subject_id)
    if (!g) groups.set(r.subject_id, (g = { id: r.subject_id, icon: r.icon, name: r.subject_name, exam_date: r.exam_date, created_at: r.subject_created_at, rows: [] }))
    g.rows.push(r)
  }
  const sorted = sortSubjects([...groups.values()], day)
  return (
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader title="Revise" />
      <p className="text-sm opacity-75">Studied, never revised · soonest exam first</p>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Mochi size={96} />
          <p className="font-bold">All caught up! 🎉</p>
        </div>
      ) : (
        sorted.map((g) => {
          const cd = countdown(g.exam_date, day)
          return (
            <section key={g.id} className="space-y-1.5">
              <h2 className="px-1 text-xs font-bold uppercase opacity-65">
                {g.icon} {g.name}
                {cd && ` · ${cd.label}`}
              </h2>
              <div className="divide-y divide-line rounded-[20px] bg-card px-3.5 shadow-[0_2px_10px_rgba(224,122,146,0.12)]">
                {g.rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 py-2.5">
                    <Link href={`/n/${r.id}`} className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{r.name}</span>
                      <span className="block truncate text-xs opacity-65">{r.topic_name}</span>
                    </Link>
                    <ReviseButton id={r.id} />
                  </div>
                ))}
              </div>
            </section>
          )
        })
      )}
    </main>
  )
}
