import Anthropic from '@anthropic-ai/sdk'
import { after } from 'next/server'
import { addChatMessage, chatExists, createChat, getRecentChatMessages, getTree, isUuid } from '@/lib/data'
import { buildRequest, chatTitle, encodeProposals, validProposals } from '@/lib/mochi'
import { apiUser, today } from '@/lib/session'
import { takeQuota } from '@/lib/usage'

export const maxDuration = 60

const REFUSAL = "Mochi can't help with that one"
const TRIPPED = 'Mochi tripped over the yarn, try again'

function validBody(body: unknown): { chatId: string | null; question: string } | null {
  const { chatId, question } = (body ?? {}) as { chatId?: unknown; question?: unknown }
  if (chatId != null && !isUuid(chatId)) return null
  if (typeof question !== 'string' || question.includes('\u0000')) return null
  const q = question.trim()
  if (q.length < 1 || q.length > 4000) return null
  return { chatId: chatId ?? null, question: q }
}

export async function POST(req: Request) {
  const user = await apiUser()
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 })

  const input = validBody(await req.json().catch(() => null))
  if (!input) return Response.json({ error: 'Bad request' }, { status: 400 })
  if (input.chatId && !(await chatExists(user.id, input.chatId)))
    return Response.json({ error: 'Chat not found' }, { status: 404 })

  const day = await today()
  if (!(await takeQuota(user.id, day)))
    return Response.json({ error: 'Mochi needs a nap — 30 questions a day. Back tomorrow!' }, { status: 429 })

  const chatId = input.chatId ?? (await createChat(user.id, chatTitle(input.question)))
  if (!(await addChatMessage(user.id, chatId, 'user', input.question)))
    return Response.json({ error: 'Chat not found' }, { status: 404 })
  const messages = await getRecentChatMessages(user.id, chatId)
  const tree = await getTree(user.id)
  const enc = new TextEncoder()
  // The stream resolves this once, whatever way it ends; after() saves it once the response is closed.
  let finish!: (reply: string) => void
  const finished = new Promise<string>((r) => (finish = r))
  after(async () => {
    const reply = await finished
    if (reply) await addChatMessage(user.id, chatId, 'assistant', reply).catch(() => {})
  })
  const body = new ReadableStream({
    async start(controller) {
      let reply = ''
      let closed = false
      let stream: ReturnType<Anthropic['messages']['stream']> | undefined
      // Client went away: stop the Claude stream so it stops billing.
      req.signal.addEventListener('abort', () => {
        closed = true
        stream?.abort()
      })
      const send = (t: string) => {
        reply += t
        if (closed) return
        try {
          controller.enqueue(enc.encode(t))
        } catch {
          closed = true
        }
      }
      try {
        if (req.signal.aborted) throw new Error('aborted')
        stream = new Anthropic().messages.stream(buildRequest({ tree, today: day, messages }))
        stream.on('text', (t: string) => send(t.replaceAll('\u001E', ''))) // model text must not forge card markers
        const final = await stream.finalMessage()
        if (final.stop_reason === 'refusal') send(reply ? `\n\n${REFUSAL}` : REFUSAL)
        else {
          const proposals = validProposals(final.content, tree, day)
          if (proposals.length) {
            // Mochi sometimes calls the tool without saying anything; never show a bare card.
            if (!reply.trim()) send(proposals.length === 1 ? 'Want me to add this to your to-dos?' : 'Want me to add these to your to-dos?')
            send(encodeProposals(proposals))
          }
        }
      } catch {
        if (!req.signal.aborted) send(reply ? `\n\n${TRIPPED}` : TRIPPED)
      }
      if (!closed) {
        closed = true
        try {
          controller.close()
        } catch {}
      }
      finish(reply) // single save point for every ending (finished, refused, errored, aborted)
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Chat-Id': chatId } })
}
