import { describe, expect, test } from 'vitest'
import { MODEL, SYSTEM_PROMPT, buildRequest, serializeTree } from '@/lib/mochi'

const tree = [
  {
    id: 's1', name: 'Pharmacology', icon: '💊', exam_date: '2026-12-10', created_at: new Date(),
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
    for (const s of ['Pharmacology', 'exam 2026-12-10', 'Autonomic drugs', 'Beta blockers', 'class ✓', 'revised 2×', 'Block beta receptors, lower HR'])
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
    expect(sys[2].text).toBe('Today is 2026-11-22.')
    expect(sys[2].cache_control).toBeUndefined()
  })
  test('system prompt rules', () => {
    expect(SYSTEM_PROMPT).toContain('📚 Beyond your notes')
    expect(SYSTEM_PROMPT).toContain('not clinical advice')
  })
})
