import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { AddForm, ItemMenu } from '@/components/Forms'
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
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader back={{ href: `/s/${subject.id}`, label: subject.name }} title={topic.name} />
      {subtopics.map((st) => (
        <div key={st.id} className="space-y-2 rounded-[20px] bg-card p-3.5 shadow-card">
          <div className="flex items-center justify-between gap-2 font-bold">
            <Link href={`/n/${st.id}`} className="min-w-0 flex-1 truncate py-2">{st.name}</Link>
            <span className="shrink-0"><RevisionStamp count={st.revision_count} done={isDone(st)} /></span>
            <span className="shrink-0"><ItemMenu kind="subtopic" id={st.id} name={st.name} revisions={st.revision_count} deleteMessage={`Delete ${st.name}?`} /></span>
          </div>
          <MarkChips id={st.id} inClass={st.in_class} selfStudy={st.self_study} />
        </div>
      ))}
      <AddForm kind="subtopic" parentId={topic.id} />
    </main>
  )
}
