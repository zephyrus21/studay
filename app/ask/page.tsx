import { notFound } from 'next/navigation'
import { SquarePen } from 'lucide-react'
import { Chat } from '@/components/Chat'
import { ChatHistory } from '@/components/ChatHistory'
import { Mochi } from '@/components/Mochi'
import { PageHeader } from '@/components/PageHeader'
import { getChatMessages, getChats, isUuid } from '@/lib/data'
import { requireUser } from '@/lib/session'

export default async function Ask({ searchParams }: PageProps<'/ask'>) {
  const { c } = await searchParams
  if (c !== undefined && !isUuid(c)) notFound()
  const chatId = c ?? null
  const user = await requireUser()
  const messages = chatId ? await getChatMessages(user.id, chatId) : []
  if (!messages) notFound()
  const chats = await getChats(user.id)
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Mochi size={36} />
            <span className="truncate">Ask Mochi</span>
          </span>
        }
        right={
          <div className="flex shrink-0 items-center">
            <ChatHistory chats={chats} currentId={chatId} />
            <a href="/ask" aria-label="New chat" className="grid min-h-11 min-w-11 place-items-center rounded-full text-brand">
              <SquarePen size={22} aria-hidden />
            </a>
          </div>
        }
      />
      <Chat key={chatId ?? 'new'} chatId={chatId} initialMessages={messages} />
    </main>
  )
}
