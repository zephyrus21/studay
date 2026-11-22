'use client'

import { useRouter } from 'next/navigation'
import { deleteSubject, deleteSubtopic, deleteTopic } from '@/app/actions'

const del = { subject: deleteSubject, topic: deleteTopic, subtopic: deleteSubtopic }

export function ConfirmDelete({
  message,
  kind,
  id,
  to,
}: {
  message: string
  kind: keyof typeof del
  id: string
  to?: string
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      className="rounded-full px-2 py-1 text-xs font-bold text-brand"
      onClick={async () => {
        if (!window.confirm(message)) return
        await del[kind](id)
        if (to) router.push(to)
      }}
    >
      Delete
    </button>
  )
}
