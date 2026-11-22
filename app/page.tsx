import { Stethoscope } from 'lucide-react'
import { Mochi } from '@/components/Mochi'
import { SubjectCard } from '@/components/SubjectCard'
import { PageHeader } from '@/components/PageHeader'
import { AddForm } from '@/components/Forms'
import { getHome } from '@/lib/data'
import { sortSubjects } from '@/lib/progress'
import { requireUser, today } from '@/lib/session'

export default async function Home() {
  const user = await requireUser()
  const day = await today()
  const subjects = await getHome(user.id, day)
  const first = user.name.trim().split(/\s+/)[0]
  const need = subjects.reduce((n, s) => n + s.unrevised, 0)
  return (
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Mochi size={36} />
            <span className="truncate">{first ? `Hi Dr. ${first}!` : 'Hi Doctor!'}</span>
          </span>
        }
      />
      {need > 0 && <p className="text-sm opacity-75">{need} {need === 1 ? 'topic needs' : 'topics need'} revision <Stethoscope size={14} aria-hidden className="inline align-middle" /></p>}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Mochi size={96} />
          <p className="font-bold">Add your first subject</p>
        </div>
      ) : (
        sortSubjects(subjects, day).map((s) => <SubjectCard key={s.id} s={s} today={day} />)
      )}
      <AddForm kind="subject" />
    </main>
  )
}
