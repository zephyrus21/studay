import Anthropic from '@anthropic-ai/sdk'
import { getTree } from '@/lib/data'
import { buildRequest, type ChatMessage } from '@/lib/mochi'
import { apiUser, today } from '@/lib/session'
import { takeQuota } from '@/lib/usage'

export const maxDuration = 60

const REFUSAL = "Mochi can't help with that one"
const TRIPPED = 'Mochi tripped over the yarn, try again'

function validMessages(body: unknown): ChatMessage[] | null {
  const m = (body as { messages?: unknown } | null)?.messages
  if (!Array.isArray(m) || m.length < 1 || m.length > 40) return null
  const ok = m.every(
    (x) => x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string' && x.content.trim().length > 0 && x.content.length <= 4000,
  )
  if (!ok || m[m.length - 1].role !== 'user') return null
  return m.map((x) => ({ role: x.role, content: x.content }))
}

export async function POST(req: Request) {
  const user = await apiUser()
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 })

  const messages = validMessages(await req.json().catch(() => null))
  if (!messages) return Response.json({ error: 'Bad request' }, { status: 400 })

  const day = await today()
  if (!(await takeQuota(user.id, day)))
    return Response.json({ error: 'Mochi needs a nap — 30 questions a day. Back tomorrow!' }, { status: 429 })

  const tree = await getTree(user.id)
  const enc = new TextEncoder()
  const body = new ReadableStream({
    async start(controller) {
      let sent = false
      let closed = false
      const send = (t: string) => {
        sent = true
        if (closed) return
        try {
          controller.enqueue(enc.encode(t))
        } catch {
          closed = true
        }
      }
      try {
        const stream = new Anthropic().messages.stream(buildRequest({ tree, today: day, messages }))
        // Client went away: stop the Claude stream so it stops billing.
        req.signal.addEventListener('abort', () => {
          closed = true
          stream.abort()
        })
        stream.on('text', send)
        const final = await stream.finalMessage()
        if (final.stop_reason === 'refusal') send(sent ? `\n\n${REFUSAL}` : REFUSAL)
      } catch {
        send(sent ? `\n\n${TRIPPED}` : TRIPPED)
      }
      if (!closed) {
        closed = true
        try {
          controller.close()
        } catch {}
      }
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}
