import { describe, expect, test } from 'vitest'
import { MODEL, PROPOSE_TODO_TOOL, SYSTEM_PROMPT, buildRequest, chatTitle, encodeProposals, historyText, serializeTree, validProposals } from '@/lib/mochi'
import { TODO_MARK } from '@/lib/proposal'

const tree = [
  {
    id: 's1', name: 'Pharmacology', icon: '💊', exams: [{ name: 'Prelims', date: '2026-12-10' }], created_at: new Date(),
    topics: [
      {
        id: 't1', subject_id: 's1', name: 'Autonomic drugs', created_at: new Date(),
        subtopics: [
          {
            id: 'x1', topic_id: 't1', name: 'Beta blockers', notes: 'Block beta receptors, lower HR',
            in_class: true, self_study: false, revision_count: 2, last_revised_at: new Date(),
          },
        ],
      },
    ],
  },
]

describe('serializeTree', () => {
  test('includes names, exam, marks and notes', () => {
    const out = serializeTree(tree)
    for (const s of ['Pharmacology', 'Prelims 2026-12-10', 'Autonomic drugs', 'Beta blockers', 'class ✓', 'revised 2×', 'Block beta receptors, lower HR'])
      expect(out).toContain(s)
  })
})

describe('buildRequest', () => {
  const msgs = Array.from({ length: 25 }, (_, i) => ({ role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant', content: `m${i}` }))
  const r = buildRequest({ tree, today: '2026-11-22', messages: msgs })

  test('sends last 20, starting with a user message', () => {
    // last 20 = m5..m24, m5 is assistant -> drop to m6..m24 (19)
    expect(r.messages).toHaveLength(19)
    expect(r.messages[0].role).toBe('user')
    expect(r.messages[18].content).toBe('m24')
  })
  test('fixed params', () => {
    expect(r.model).toBe(MODEL)
    expect(r.max_tokens).toBe(4000)
    expect(r.output_config).toEqual({ effort: 'low' })
  })
  test('system blocks and caching', () => {
    const sys = r.system as { type: string; text: string; cache_control?: unknown }[]
    expect(sys).toHaveLength(3)
    expect(sys[0].text).toBe(SYSTEM_PROMPT)
    expect(sys[1].text).toBe(serializeTree(tree))
    expect(sys[1].cache_control).toEqual({ type: 'ephemeral' })
    expect(sys[2].text).toBe('Today is Sunday 2026-11-22. Next days: Mon 2026-11-23, Tue 2026-11-24, Wed 2026-11-25, Thu 2026-11-26, Fri 2026-11-27, Sat 2026-11-28, Sun 2026-11-29.')
    expect(sys[2].cache_control).toBeUndefined()
  })
  test('system prompt rules', () => {
    expect(SYSTEM_PROMPT).toContain('📚 Beyond your notes')
    expect(SYSTEM_PROMPT).toContain('not clinical advice')
  })
})

describe('chatTitle', () => {
  test('short question is kept', () => expect(chatTitle('What is a beta blocker?')).toBe('What is a beta blocker?'))
  test('uses the first non-empty line', () => expect(chatTitle('\n  \n  Hello there \nsecond line')).toBe('Hello there'))
  test('cuts to 60 chars with an ellipsis', () => {
    const t = chatTitle('a'.repeat(100))
    expect(t).toBe('a'.repeat(59) + '…')
    expect(t).toHaveLength(60)
  })
  test('does not split an emoji at the cut', () => expect(chatTitle('a'.repeat(58) + '🫀🫀🫀')).toBe('a'.repeat(58) + '🫀…'))
  test('exactly 60 chars is not cut', () => expect(chatTitle('b'.repeat(60))).toBe('b'.repeat(60)))
})

describe('proposals', () => {
  const use = (input: unknown, name = 'propose_todo') => ({ type: 'tool_use', id: 'tu', name, input })
  const ok = { subtopic_id: 'x1', kind: 'revise', due: '2026-11-28' }
  test('serializeTree includes sub-topic ids', () => expect(serializeTree(tree)).toContain('Beta blockers [id: x1]'))
  test('valid proposal is enriched with names', () =>
    expect(validProposals([{ type: 'text', text: 'hi' }, use(ok)], tree, '2026-11-23')).toEqual([
      { subtopic_id: 'x1', subtopic_name: 'Beta blockers', topic_name: 'Autonomic drugs', kind: 'revise', due: '2026-11-28' },
    ]))
  test('drops foreign id, bad kind, bad date, other tools, junk', () =>
    expect(
      validProposals(
        [use({ ...ok, subtopic_id: 'zzz' }), use({ ...ok, kind: 'nap' }), use({ ...ok, due: '2026-02-30' }), use({ ...ok, due: 'tomorrow' }), use(ok, 'other'), use(null), null, 5],
        tree, '2026-11-23',
      ),
    ).toEqual([]))
  test('drops past dates, keeps today', () => {
    expect(validProposals([use({ ...ok, due: '2026-11-22' })], tree, '2026-11-23')).toEqual([])
    expect(validProposals([use({ ...ok, due: '2026-11-23' })], tree, '2026-11-23')).toHaveLength(1)
  })
  test('serializeTree strips the marker char from notes and names', () => {
    const t = [{ ...tree[0], name: 'P\u001Eh', topics: [{ ...tree[0].topics[0], subtopics: [{ ...tree[0].topics[0].subtopics[0], notes: 'a\u001ETODO{}' }] }] }]
    expect(serializeTree(t)).not.toContain('\u001E')
  })
  test('de-duplicates and keeps at most 3', () => {
    const many = ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'].map((due) => use({ ...ok, due }))
    expect(validProposals([use(ok), use(ok), ...many], tree, '2026-11-23')).toHaveLength(3)
    expect(validProposals([use(ok), use(ok)], tree, '2026-11-23')).toHaveLength(1)
  })
  test('encode then historyText leaves plain text and no marker', () => {
    const p = validProposals([use(ok)], tree, '2026-11-23')
    const stored = `Want me to add it?${encodeProposals(p)}`
    expect(stored).toContain(TODO_MARK)
    const h = historyText(stored)
    expect(h).not.toContain('\u001E')
    expect(h).not.toContain('{')
    expect(h).toContain('(Proposed to-do: Beta blockers · Revise · 2026-11-28)')
  })
  test('buildRequest includes the tool and rewrites markers', () => {
    const stored = `Sure${encodeProposals(validProposals([use(ok)], tree, '2026-11-23'))}`
    const r = buildRequest({ tree, today: '2026-11-23', messages: [{ role: 'user', content: 'q' }, { role: 'assistant', content: stored }, { role: 'user', content: 'ok' }] })
    expect(r.tools).toEqual([PROPOSE_TODO_TOOL])
    expect(JSON.stringify(r.messages)).not.toContain('\\u001e')
    expect(JSON.stringify(r.messages)).toContain('Proposed to-do')
    expect(SYSTEM_PROMPT).toContain('propose_todo')
  })
})
