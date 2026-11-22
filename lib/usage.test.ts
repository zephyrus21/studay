import { afterAll, describe, expect, test } from 'vitest'

const run = !!process.env.TEST_DATABASE_URL
if (!run) console.warn('SKIPPED lib/usage.test.ts: TEST_DATABASE_URL is not set')

describe.skipIf(!run)('quota (TEST_DATABASE_URL)', async () => {
  const { takeQuota } = await import('@/lib/usage')
  const { sql } = await import('@/lib/db')
  const prefix = `t-${crypto.randomUUID()}-`

  afterAll(async () => {
    await sql`delete from ai_usage where user_id like ${prefix + '%'}`
  })

  test('quota is atomic', async () => {
    const u = `${prefix}q1`
    for (let i = 0; i < 30; i++) expect(await takeQuota(u, '2026-11-22')).toBe(true)
    expect(await takeQuota(u, '2026-11-22')).toBe(false)
    const par = await Promise.all(Array.from({ length: 35 }, () => takeQuota(u, '2026-11-23')))
    expect(par.filter(Boolean)).toHaveLength(30)
    expect(await takeQuota(u, '2026-11-24')).toBe(true)
  })
})
