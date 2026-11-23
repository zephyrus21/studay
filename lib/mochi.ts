import type Anthropic from '@anthropic-ai/sdk'
import type { TodoKind, getTree } from '@/lib/data'
import { PRIORITY, todoTime } from '@/lib/todo-time'
import { TODO_MARK, type Proposal } from '@/lib/proposal'

export const MODEL = 'claude-haiku-5-5'

export const SYSTEM_PROMPT = `You are Dr. Mochi, a friendly cat study buddy for an MBBS student. Be warm, concise and clear.
The student's own notes and progress are given below. Answer from their notes first.
If you add anything that is not in their notes, put it under a line that starts with "📚 Beyond your notes".
Say so when you are unsure instead of guessing. You are a study aid, not clinical advice.
Use the exam dates and today's date for countdowns and to suggest what to revise first.
You can offer to-dos with the propose_todo tool (sub_topic ids are in the notes). Offer one when the student mentions an upcoming exam, asks what to study or revise, states an intention ("I'll study X tomorrow"), or has never-revised sub-topics facing a near exam.
Convert relative dates ("Friday", "next week") using today's date. If the sub-topic is ambiguous, ask instead of guessing. Offer at most 3 per reply, and do not offer again in a chat after the student declines.
Include start/end (HH:MM, 24-hour) only when the student mentions a time or asks for a timed plan. Set priority to high for gaps close to an exam and low for nice-to-haves; otherwise omit it (Medium).
Always say in your text that you are offering (e.g. "Want me to add this to your to-dos?"); the student confirms with a card, you cannot add anything yourself.`

// Client-defined, never executed: the server only reads the tool_use block from finalMessage().
export const PROPOSE_TODO_TOOL: Anthropic.Tool = {
  name: 'propose_todo',
  description: "Offer the student a to-do for one sub-topic. The student confirms it with a card; nothing is created until they tap Add.",
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      subtopic_id: { type: 'string', description: 'The [id: …] of a sub-topic from the notes' },
      kind: { type: 'string', enum: ['class', 'self', 'revise'] },
      due: { type: 'string', description: 'Date as YYYY-MM-DD' },
      start: { type: 'string', description: 'Optional start time, HH:MM 24-hour' },
      end: { type: 'string', description: 'Optional end time, HH:MM 24-hour, after start' },
      priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Optional; omit for medium' },
    },
    required: ['subtopic_id', 'kind', 'due'],
    additionalProperties: false,
  },
}

const KINDS = ['class', 'self', 'revise']
const validDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v

type Tree = Awaited<ReturnType<typeof getTree>>
export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function chatTitle(question: string): string {
  const line = question.split('\n').map((l) => l.trim()).find(Boolean) ?? ''
  const cps = Array.from(line)
  return cps.length > 60 ? `${cps.slice(0, 59).join('')}…` : line
}

const clean = (v: string) => v.replaceAll('\u001E', '') // only the server may emit card markers

export function serializeTree(tree: Tree): string {
  if (tree.length === 0) return 'The student has no subjects yet.'
  return tree
    .map((s) => {
      const topics = s.topics
        .map((t) => {
          const subs = t.subtopics
            .map((x) => {
              const marks = [x.in_class && 'class ✓', x.self_study && 'self ✓', `revised ${x.revision_count}×`].filter(Boolean).join(', ')
              return `    - ${clean(x.name)} [id: ${x.id}] (${marks})${x.notes ? `\n      Notes: ${clean(x.notes).replace(/\n/g, '\n      ')}` : ''}`
            })
            .join('\n')
          return `  Topic: ${clean(t.name)}${subs ? `\n${subs}` : ''}`
        })
        .join('\n')
      return `Subject: ${clean(s.name)}${s.exams.length ? ` (exams: ${s.exams.map((e) => `${clean(e.name)} ${e.date}`).join(', ')})` : ''}${topics ? `\n${topics}` : ''}`
    })
    .join('\n\n')
}

export function validProposals(blocks: unknown[], tree: Tree, today: string): Proposal[] {
  const subs = new Map<string, Proposal>()
  for (const s of tree)
    for (const t of s.topics)
      for (const x of t.subtopics) subs.set(x.id, { subtopic_id: x.id, subtopic_name: x.name, topic_name: t.name, kind: 'class', due: '' })
  const out: Proposal[] = []
  for (const b of blocks) {
    const blk = b as { type?: unknown; name?: unknown; input?: { subtopic_id?: unknown; kind?: unknown; due?: unknown; start?: unknown; end?: unknown; priority?: unknown } | null } | null
    if (blk?.type !== 'tool_use' || blk.name !== 'propose_todo') continue
    const { subtopic_id, kind, due, start, end, priority } = blk.input ?? {}
    const base = typeof subtopic_id === 'string' ? subs.get(subtopic_id) : undefined
    if (!base || typeof kind !== 'string' || !KINDS.includes(kind) || !validDate(due) || due < today) continue
    // Invalid times are dropped, not the whole proposal; a valid start survives a bad end.
    const full = todoTime(start as string, end as string)
    const t = typeof full === 'string' ? todoTime(start as string, null) : full
    const st = typeof t === 'object' ? t.start : null
    if (out.some((p) => p.subtopic_id === subtopic_id && p.kind === kind && p.due === due && (p.start ?? null) === st)) continue
    const p = typeof priority === 'string' && Object.hasOwn(PRIORITY, priority) ? (priority as Proposal['priority']) : undefined
    out.push({
      ...base, kind: kind as TodoKind, due,
      ...(typeof t === 'object' && t.start ? { start: t.start, ...(t.end && { end: t.end }) } : {}),
      ...(p && { priority: p }),
    })
    if (out.length === 3) break
  }
  return out
}

export const encodeProposals = (p: Proposal[]) => p.map((x) => `\n${TODO_MARK}${JSON.stringify(x)}`).join('')

// Stored replies carry card markers; Claude sees them as plain text.
export function historyText(content: string): string {
  return content.replace(new RegExp(`\\n?${TODO_MARK}(\\{.*\\})`, 'g'), (_, json: string) => {
    try {
      const p = JSON.parse(json) as Proposal
      return `\n(Proposed to-do: ${p.subtopic_name} · ${p.kind[0].toUpperCase()}${p.kind.slice(1)} · ${p.due})`
    } catch {
      return ''
    }
  })
}

// Weekday names so Mochi doesn't guess them (it mislabelled dates in testing).
function dayLine(today: string): string {
  const day = (offset: number, weekday: 'long' | 'short') => {
    const d = new Date(`${today}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + offset)
    return `${d.toLocaleDateString('en-GB', { weekday, timeZone: 'UTC' })} ${d.toISOString().slice(0, 10)}`
  }
  const next = [1, 2, 3, 4, 5, 6, 7].map((n) => day(n, 'short')).join(', ')
  return `Today is ${day(0, 'long')}. Next days: ${next}.`
}

export function buildRequest(args: { tree: Tree; today: string; messages: ChatMessage[] }): Anthropic.MessageStreamParams {
  const messages = args.messages.slice(-20).map((m) => (m.role === 'assistant' ? { ...m, content: historyText(m.content) } : m))
  while (messages.length > 0 && messages[0].role !== 'user') messages.shift()
  return {
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: SYSTEM_PROMPT },
      { type: 'text', text: serializeTree(args.tree), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: dayLine(args.today) },
    ],
    tools: [PROPOSE_TODO_TOOL],
    messages,
  }
}
