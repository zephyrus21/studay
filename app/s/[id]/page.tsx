import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bar } from '@/components/SubjectCard'
import { AddForm, ExamDate, RenameForm } from '@/components/Forms'
import { ConfirmDelete } from '@/components/ConfirmDelete'
import { getSubject } from '@/lib/data'
import { countdown, percent } from '@/lib/progress'
import { requireUser, today } from '@/lib/session'

export default async function SubjectPage({ params }: PageProps<'/s/[id]'>) {
  const { id } = await params
  const user = await requireUser()
  const r = await getSubject(user.id, id)
  if (!r) notFound()
  const { subject: s, topics } = r
  const cd = countdown(s.exam_date, await today())
  return (
    <main className="mx-auto w-full max-w-md space-y-3 p-4">
      <Link href="/" className="text-sm font-bold text-brand">← Subjects</Link>
      <div className="flex items-center gap-2 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-chip">{s.icon}</span>
        <span className="min-w-0 flex-1 truncate">{s.name}</span>
        {cd && <span className={`rounded-full border-[1.2px] border-accent px-2 py-0.5 text-[11px] font-bold ${cd.urgent ? 'bg-accent text-white' : 'bg-card'}`}>{cd.label}</span>}
      </div>
      <ExamDate id={s.id} value={s.exam_date} />
      <div className="flex items-center">
        <RenameForm kind="subject" id={s.id} name={s.name} />
        <ConfirmDelete kind="subject" id={s.id} to="/" message={`Delete ${s.name} and its ${topics.length} topics?`} />
      </div>
      {topics.map((t) => (
        <div key={t.id} className="rounded-[18px] border-[1.5px] border-line bg-card p-3.5">
          <Link href={`/t/${t.id}`} className="block">
            <div className="flex justify-between font-bold"><span className="truncate">{t.name}</span><span>{percent(t.done, t.total)}%</span></div>
            <div className="my-1.5 text-xs opacity-65">{t.done} of {t.total} sub-topics</div>
            <Bar value={percent(t.done, t.total)} />
          </Link>
          <div className="mt-2 flex items-center">
            <RenameForm kind="topic" id={t.id} name={t.name} />
            <ConfirmDelete kind="topic" id={t.id} message={`Delete ${t.name} and its ${t.total} sub-topics?`} />
          </div>
        </div>
      ))}
      <AddForm kind="topic" parentId={s.id} />
    </main>
  )
}
