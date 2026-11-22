import { PageHeader } from '@/components/PageHeader'
import { Todos } from '@/components/Todos'
import { getPickList, getTodos } from '@/lib/data'
import { requireUser, today } from '@/lib/session'

export default async function Todo() {
  const user = await requireUser()
  const day = await today()
  const [todos, picks] = await Promise.all([getTodos(user.id), getPickList(user.id)])
  return (
    <main className="mx-auto w-full max-w-md space-y-3 px-4 pb-16">
      <PageHeader title="To-do" />
      <Todos todos={todos} picks={picks} today={day} />
    </main>
  )
}
