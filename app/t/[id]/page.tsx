import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddForm, RenameForm } from '@/components/Forms'
import { ConfirmDelete } from '@/components/ConfirmDelete'
import { MarkChips } from '@/components/MarkChips'
import { RevisionStamp } from '@/components/RevisionStamp'
import { getTopic } from '@/lib/data'
import { isDone } from '@/lib/progress'
import { requireUser } from '@/lib/session'

export default async function TopicPage({ params }: PageProps<'/t/[id]'>) {
  const { id } = await params
  const user = await requireUser()
  const r = await getTopic(user.id, id)
  if (!r) notFound()
  const { subject, topic, subtopics } = r
  return (
    <main className="mx-auto w-full max-w-md space-y-3 p-4">
      <Link href={`/s/${subject.id}`} className="text-sm font-bold text-brand">← {subject.name}</Link>
      <h1 className="text-lg font-extrabold">{topic.name}</h1>
      {subtopics.map((st) => (
        <div key={st.id} className="space-y-2 rounded-[18px] border-[1.5px] border-line bg-card p-3.5">
          <div className="flex items-center justify-between gap-2 font-bold">
            <Link href={`/n/${st.id}`} className="min-w-0 truncate">{st.name}</Link>
            <RevisionStamp count={st.revision_count} done={isDone(st)} />
          </div>
          <MarkChips id={st.id} inClass={st.in_class} selfStudy={st.self_study} />
          <div className="flex items-center">
            <RenameForm kind="subtopic" id={st.id} name={st.name} />
            <ConfirmDelete kind="subtopic" id={st.id} message={`Delete ${st.name}?`} />
          </div>
        </div>
      ))}
      <AddForm kind="subtopic" parentId={topic.id} />
    </main>
  )
}
