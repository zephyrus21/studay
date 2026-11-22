import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ConfirmDelete } from '@/components/ConfirmDelete'
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
    <main className="mx-auto w-full max-w-md space-y-3 p-4">
      <Link href={`/t/${topic.id}`} className="text-sm font-bold text-brand">← {topic.name}</Link>
      <div className="flex items-center justify-between gap-2 text-lg font-extrabold">
        <h1 className="min-w-0 truncate">{st.name}</h1>
        <RevisionStamp count={st.revision_count} done={isDone(st)} />
      </div>
      <MarkChips id={st.id} inClass={st.in_class} selfStudy={st.self_study} canUndo revisions={st.revision_count} />
      {st.last_revised_at && (
        <p className="text-xs opacity-65">Last revised {st.last_revised_at.toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: tz })}</p>
      )}
      <NotesEditor id={st.id} initial={st.notes} />
      <ConfirmDelete kind="subtopic" id={st.id} to={`/t/${topic.id}`} message={`Delete ${st.name}?`} />
    </main>
  )
}
