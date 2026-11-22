import type Anthropic from '@anthropic-ai/sdk'
import type { getTree } from '@/lib/data'

export const MODEL = 'claude-haiku-5-5'

export const SYSTEM_PROMPT = `You are Dr. Mochi, a friendly cat study buddy for an MBBS student. Be warm, concise and clear.
The student's own notes and progress are given below. Answer from their notes first.
If you add anything that is not in their notes, put it under a line that starts with "📚 Beyond your notes".
Say so when you are unsure instead of guessing. You are a study aid, not clinical advice.
Use the exam dates and today's date for countdowns and to suggest what to revise first.`

type Tree = Awaited<ReturnType<typeof getTree>>
export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function chatTitle(question: string): string {
  const line = question.split('\n').map((l) => l.trim()).find(Boolean) ?? ''
  const cps = Array.from(line)
  return cps.length > 60 ? `${cps.slice(0, 59).join('')}…` : line
}

export function serializeTree(tree: Tree): string {
  if (tree.length === 0) return 'The student has no subjects yet.'
  return tree
    .map((s) => {
      const topics = s.topics
        .map((t) => {
          const subs = t.subtopics
            .map((x) => {
              const marks = [x.in_class && 'class ✓', x.self_study && 'self ✓', `revised ${x.revision_count}×`].filter(Boolean).join(', ')
              return `    - ${x.name} (${marks})${x.notes ? `\n      Notes: ${x.notes.replace(/\n/g, '\n      ')}` : ''}`
            })
            .join('\n')
          return `  Topic: ${t.name}${subs ? `\n${subs}` : ''}`
        })
        .join('\n')
      return `Subject: ${s.name}${s.exams.length ? ` (exams: ${s.exams.map((e) => `${e.name} ${e.date}`).join(', ')})` : ''}${topics ? `\n${topics}` : ''}`
    })
    .join('\n\n')
}

export function buildRequest(args: { tree: Tree; today: string; messages: ChatMessage[] }): Anthropic.MessageStreamParams {
  const messages = args.messages.slice(-20)
  while (messages.length > 0 && messages[0].role !== 'user') messages.shift()
  return {
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: SYSTEM_PROMPT },
      { type: 'text', text: serializeTree(args.tree), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `Today is ${args.today}.` },
    ],
    messages,
  }
}
