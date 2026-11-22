import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProgressBars } from '@/components/SubjectCard'
import { CountdownIcon, SubjectIcon } from '@/components/SubjectIcon'
import { PageHeader } from '@/components/PageHeader'
import { AddForm, ItemMenu } from '@/components/Forms'
import { Exams } from '@/components/Exams'
import { getSubject } from '@/lib/data'
import { countdown } from '@/lib/progress'
import { requireUser, today } from '@/lib/session'

export default async function SubjectPage({ params }: PageProps<'/s/[id]'>) {
  const { id } = await params
  const user = await requireUser()
  const r = await getSubject(user.id, id)
  if (!r) notFound()
  const { subject: s, topics, exams } = r
  const day = await today()
  const next = exams.find((e) => e.date >= day)
  const cd = countdown(next?.date ?? null, day, next?.name ?? 'Exam')
  return (
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader
        back={{ href: '/', label: 'Subjects' }}
        title={
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-chip"><SubjectIcon icon={s.icon} size={20} /></span>
            <span className="truncate">{s.name}</span>
          </span>
        }
        right={<ItemMenu kind="subject" id={s.id} name={s.name} to="/" deleteMessage={`Delete ${s.name} and its ${topics.length} topics?`} />}
      />
      {cd && <span className={`inline-flex items-center gap-1 rounded-full border-[1.2px] border-accent px-2 py-0.5 text-[11px] font-bold ${cd.urgent ? 'bg-accent text-on-accent' : 'bg-card'}`}><CountdownIcon today={cd.today} />{cd.label}</span>}
      <Exams subjectId={s.id} exams={exams} today={day} />
      {topics.map((t) => (
        <div key={t.id} className="flex items-start gap-1 rounded-[20px] bg-card p-3.5 shadow-card">
          <Link href={`/t/${t.id}`} className="block min-w-0 flex-1">
            <div className="truncate font-bold">{t.name}</div>
            <div className="my-1.5 text-xs opacity-65">{t.done} of {t.total} sub-topics</div>
            <ProgressBars total={t.total} classCount={t.class_count} selfCount={t.self_count} revised={t.revised} />
          </Link>
          <span className="-mt-2.5 shrink-0"><ItemMenu kind="topic" id={t.id} name={t.name} deleteMessage={`Delete ${t.name} and its ${t.total} sub-topics?`} /></span>
        </div>
      ))}
      <AddForm kind="topic" parentId={s.id} />
    </main>
  )
}
