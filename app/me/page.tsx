import { Stethoscope } from 'lucide-react'
import { cookies } from 'next/headers'
import { PageHeader } from '@/components/PageHeader'
import { SignOut } from '@/components/SignOut'
import { ChangePassword } from '@/components/ChangePassword'
import { ThemePicker } from '@/components/ThemePicker'
import { getHome } from '@/lib/data'
import { requireUser, today } from '@/lib/session'
import { themeFrom } from '@/lib/theme'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

export default async function Me() {
  const user = await requireUser()
  const subjects = await getHome(user.id, await today())
  const first = user.name.trim().split(/\s+/)[0]
  const done = subjects.reduce((n, s) => n + s.done, 0)
  const total = subjects.reduce((n, s) => n + s.total, 0)
  const revisions = subjects.reduce((n, s) => n + s.revisions, 0)
  const theme = themeFrom((await cookies()).get('theme')?.value) ?? 'system'
  return (
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader title="Me" />
      <div className="flex flex-col items-center gap-1 rounded-[20px] bg-card p-5 text-center shadow-card">
        <Stethoscope size={40} aria-hidden />
        <p className="text-lg font-black">{first ? `Dr. ${first}` : 'Doctor'}</p>
        <p className="break-all text-sm opacity-65">{user.email}</p>
      </div>
      <div className="divide-y divide-line rounded-[20px] bg-card px-3.5 shadow-card">
        <Stat label="Subjects" value={subjects.length} />
        <Stat label="Sub-topics done" value={`${done} / ${total}`} />
        <Stat label="Revisions logged" value={revisions} />
      </div>
      <div className="space-y-2 rounded-[20px] bg-card p-3.5 shadow-card">
        <p className="font-bold">Appearance</p>
        <ThemePicker initial={theme} />
      </div>
      <ChangePassword />
      <SignOut className="w-full" />
    </main>
  )
}
