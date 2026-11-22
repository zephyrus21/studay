import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bar } from '@/components/SubjectCard'
import { PageHeader } from '@/components/PageHeader'
import { AddForm, ExamDate, ItemMenu } from '@/components/Forms'
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
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader
        back={{ href: '/', label: 'Subjects' }}
        title={
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-chip text-xl">{s.icon}</span>
            <span className="truncate">{s.name}</span>
          </span>
        }
        right={<ItemMenu kind="subject" id={s.id} name={s.name} to="/" deleteMessage={`Delete ${s.name} and its ${topics.length} topics?`} />}
      />
      {cd && <span className={`inline-block rounded-full border-[1.2px] border-accent px-2 py-0.5 text-[11px] font-bold ${cd.urgent ? 'bg-accent text-white' : 'bg-card'}`}>{cd.label}</span>}
      <ExamDate id={s.id} value={s.exam_date} />
      {topics.map((t) => (
        <div key={t.id} className="flex items-center gap-1 rounded-[20px] bg-card p-3.5 shadow-[0_2px_10px_rgba(224,122,146,0.12)]">
          <Link href={`/t/${t.id}`} className="block min-w-0 flex-1">
            <div className="flex justify-between gap-2 font-bold"><span className="truncate">{t.name}</span><span>{percent(t.done, t.total)}%</span></div>
            <div className="my-1.5 text-xs opacity-65">{t.done} of {t.total} sub-topics</div>
            <Bar value={percent(t.done, t.total)} />
          </Link>
          <ItemMenu kind="topic" id={t.id} name={t.name} deleteMessage={`Delete ${t.name} and its ${t.total} sub-topics?`} />
        </div>
      ))}
      <AddForm kind="topic" parentId={s.id} />
    </main>
  )
}
