import { afterAll, describe, expect, test } from 'vitest'

const run = !!process.env.TEST_DATABASE_URL
if (!run) console.warn('SKIPPED lib/data.test.ts: TEST_DATABASE_URL is not set')

describe.skipIf(!run)('data layer (TEST_DATABASE_URL)', async () => {
  const d = await import('@/lib/data')
  const { sql } = await import('@/lib/db')
  const id = crypto.randomUUID()
  const prefix = `t-${id}-`
  const u1 = `${prefix}u1`
  const u2 = `${prefix}u2`

  afterAll(async () => {
    await sql`delete from subjects where user_id like ${prefix + '%'}`
  })

  async function seed(user: string, names: string[] = ['s']) {
    const sub = (await d.createSubject(user, 'Anatomy', '🫀'))!
    const top = (await d.createTopic(user, sub, 'T'))!
    const subs: string[] = []
    for (const n of names) subs.push((await d.createSubtopic(user, top, n))!)
    return { sub, top, subs }
  }

  test('create and read tree', async () => {
    const user = `${u1}-tree`
    const { sub } = await seed(user)
    const tree = await d.getTree(user)
    expect(tree).toHaveLength(1)
    expect(tree[0].topics).toHaveLength(1)
    expect(tree[0].topics[0].subtopics).toHaveLength(1)
    expect(tree[0].created_at).toBeInstanceOf(Date)
    expect(tree[0].exam_date).toBeNull()
    expect((await d.getHome(user))[0].total).toBe(1)
    await d.updateSubject(user, sub, { exam_date: '2027-01-05' })
    expect((await d.getHome(user))[0].exam_date).toBe('2027-01-05')
    await sql`delete from subjects where user_id = ${user}`
  })

  test('counts', async () => {
    const user = `${u1}-counts`
    const { sub, top, subs } = await seed(user, ['a', 'b', 'c', 'd'])
    await d.updateSubtopic(user, subs[0], { in_class: true })
    await d.updateSubtopic(user, subs[1], { self_study: true })
    await d.bumpRevision(user, subs[2], 1)
    await d.bumpRevision(user, subs[2], 1)
    const want = { total: 4, done: 2, class_count: 1, self_count: 1, revisions: 2, unrevised: 2 }
    expect((await d.getHome(user))[0]).toMatchObject(want)
    expect((await d.getSubject(user, sub))!.topics[0]).toMatchObject({ total: 4, done: 2 })
    expect((await d.getTopic(user, top))!.subtopics).toHaveLength(4)
    expect((await d.getSubtopic(user, subs[2]))!.subtopic.revision_count).toBe(2)
  })

  test("rejects other users' ids", async () => {
    const { sub, top, subs } = await seed(u1)
    expect(await d.updateSubtopic(u2, subs[0], { notes: 'x' })).toBe(false)
    expect(await d.bumpRevision(u2, subs[0], 1)).toBe(false)
    expect(await d.deleteSubject(u2, sub)).toBe(false)
    expect(await d.createTopic(u2, sub, 'x')).toBeNull()
    expect(await d.createSubtopic(u2, top, 'x')).toBeNull()
    expect(await d.getSubject(u2, sub)).toBeNull()
    expect(await d.getTopic(u2, top)).toBeNull()
    expect(await d.getSubtopic(u2, subs[0])).toBeNull()
    expect(await d.updateSubject(u2, sub, { name: 'x', exam_date: '2030-01-01' })).toBe(false)
    expect(await d.renameTopic(u2, top, 'x')).toBe(false)
    expect(await d.deleteTopic(u2, top)).toBe(false)
    expect(await d.deleteSubtopic(u2, subs[0])).toBe(false)
    const [s1] = (await d.getTree(u1)).filter((s) => s.id === sub)
    expect(s1.name).toBe('Anatomy')
    expect(s1.exam_date).toBeNull()
    expect(s1.topics).toHaveLength(1)
    expect(s1.topics[0].name).toBe('T')
    expect(s1.topics[0].subtopics).toHaveLength(1)
    const s = s1.topics[0].subtopics[0]
    expect(s.id).toBe(subs[0])
    expect(s.name).toBe('s')
    expect(s.notes).toBe('')
    expect(s.revision_count).toBe(0)
  })

  test('revision bumps', async () => {
    const { subs } = await seed(`${u1}-bump`)
    const user = `${u1}-bump`
    await d.bumpRevision(user, subs[0], 1)
    await d.bumpRevision(user, subs[0], 1)
    let s = (await d.getSubtopic(user, subs[0]))!.subtopic
    expect(s.revision_count).toBe(2)
    expect(s.last_revised_at).toBeInstanceOf(Date)
    const before = s.last_revised_at!.getTime()
    await d.bumpRevision(user, subs[0], -1)
    s = (await d.getSubtopic(user, subs[0]))!.subtopic
    expect(s.revision_count).toBe(1)
    expect(s.last_revised_at!.getTime()).toBe(before)
  })

  test('revision cannot go below zero', async () => {
    const user = `${u1}-zero`
    const { subs } = await seed(user)
    await d.bumpRevision(user, subs[0], 1)
    expect(await d.bumpRevision(user, subs[0], -1)).toBe(true)
    expect(await d.bumpRevision(user, subs[0], -1)).toBe(false)
    const s = (await d.getSubtopic(user, subs[0]))!.subtopic
    expect(s.revision_count).toBe(0)
    expect(s.last_revised_at).toBeNull()
  })

  test('partial updateSubject', async () => {
    const user = `${u1}-patch`
    const { sub } = await seed(user)
    const get = async () => (await d.getHome(user))[0]
    await d.updateSubject(user, sub, { exam_date: '2027-01-05' })
    await d.updateSubject(user, sub, { name: 'Renamed' })
    expect(await get()).toMatchObject({ name: 'Renamed', exam_date: '2027-01-05', icon: '🫀' })
    await d.updateSubject(user, sub, { exam_date: null })
    expect(await get()).toMatchObject({ name: 'Renamed', exam_date: null })
  })

  test('cascade', async () => {
    const user = `${u1}-cascade`
    const { sub, top, subs } = await seed(user)
    expect(await d.deleteSubject(user, sub)).toBe(true)
    expect(await d.getTopic(user, top)).toBeNull()
    expect(await d.getSubtopic(user, subs[0])).toBeNull()
    const [r] = await sql`select count(*)::int as n from subtopics where id = ${subs[0]}`
    expect(r.n).toBe(0)
  })

  test('three-colour counts (class, self, revised = sub-topics with any revision)', async () => {
    const user = `${u1}-bars`
    const { sub, subs } = await seed(user, ['a', 'b', 'c'])
    await d.updateSubtopic(user, subs[0], { in_class: true, self_study: true })
    await d.updateSubtopic(user, subs[1], { self_study: true })
    await d.bumpRevision(user, subs[1], 1)
    await d.bumpRevision(user, subs[1], 1)
    expect((await d.getHome(user))[0]).toMatchObject({ total: 3, class_count: 1, self_count: 2, revised: 1 })
    expect((await d.getSubject(user, sub))!.topics[0]).toMatchObject({ total: 3, done: 2, class_count: 1, self_count: 2, revised: 1 })
    await sql`delete from subjects where user_id = ${user}`
  })

  test('getRevise lists only done, never-revised sub-topics of this user', async () => {
    const user = `${u1}-revise`
    const { subs } = await seed(user, ['done', 'revised', 'untouched'])
    await d.updateSubtopic(user, subs[0], { in_class: true })
    await d.updateSubtopic(user, subs[1], { self_study: true })
    await d.bumpRevision(user, subs[1], 1)
    await seed(`${u2}-revise`, ['other'])
    const rows = await d.getRevise(user)
    expect(rows.map((r) => r.name)).toEqual(['done'])
    expect(rows[0]).toMatchObject({ topic_name: 'T', subject_name: 'Anatomy', icon: '🫀', exam_date: null })
    await d.bumpRevision(user, subs[0], 1)
    expect(await d.getRevise(user)).toEqual([])
    await sql`delete from subjects where user_id in (${user}, ${`${u2}-revise`})`
  })
})
