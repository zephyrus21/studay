import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ItemMenu } from '@/components/Forms'
import { PageHeader } from '@/components/PageHeader'
import { MarkChips } from '@/components/MarkChips'
import { NotesEditor } from '@/components/NotesEditor'
import { RevisionStamp } from '@/components/RevisionStamp'
import { getSubtopic } from '@/lib/data'
import { isDone } from '@/lib/progress'
import { requireUser } from '@/lib/session'

export default async function SubtopicPage({ params }: PageProps<'/n/[id]'>) {
  const { id } = await params
  const user = await requireUser()
  const r = await getSubtopic(user.id, id)
  if (!r) notFound()
  const { topic, subtopic: st } = r
  let tz = (await cookies()).get('tz')?.value ?? 'UTC'
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz })
  } catch {
    tz = 'UTC'
  }
  return (
    <main className="mx-auto w-full max-w-md space-y-3 px-4">
      <PageHeader
        back={{ href: `/t/${topic.id}`, label: topic.name }}
        title={st.name}
        right={<ItemMenu kind="subtopic" id={st.id} name={st.name} to={`/t/${topic.id}`} deleteMessage={`Delete ${st.name}?`} />}
      />
      <RevisionStamp count={st.revision_count} done={isDone(st)} />
      <MarkChips id={st.id} inClass={st.in_class} selfStudy={st.self_study} canUndo revisions={st.revision_count} />
      {st.last_revised_at && (
        <p className="text-xs opacity-65">Last revised {st.last_revised_at.toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: tz })}</p>
      )}
      <NotesEditor id={st.id} initial={st.notes} />
    </main>
  )
}
