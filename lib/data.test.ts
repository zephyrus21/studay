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
  const today = '2026-11-22'

  afterAll(async () => {
    await sql`delete from subjects where user_id like ${prefix + '%'}`
    await sql`delete from chats where user_id like ${prefix + '%'}`
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
    expect(tree[0].exams).toEqual([])
    expect((await d.getHome(user, today))[0].total).toBe(1)
    await d.createExam(user, sub, 'Prelims', '2027-01-05')
    expect((await d.getHome(user, today))[0]).toMatchObject({ exam_name: 'Prelims', exam_date: '2027-01-05' })
    expect((await d.getTree(user))[0].exams).toEqual([{ name: 'Prelims', date: '2027-01-05' }])
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
    expect((await d.getHome(user, today))[0]).toMatchObject(want)
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
    expect(await d.updateSubject(u2, sub, { name: 'x' })).toBe(false)
    expect(await d.renameTopic(u2, top, 'x')).toBe(false)
    expect(await d.deleteTopic(u2, top)).toBe(false)
    expect(await d.deleteSubtopic(u2, subs[0])).toBe(false)
    const [s1] = (await d.getTree(u1)).filter((s) => s.id === sub)
    expect(s1.name).toBe('Anatomy')
    expect(s1.exams).toEqual([])
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
    await d.updateSubject(user, sub, { name: 'Renamed' })
    expect((await d.getHome(user, today))[0]).toMatchObject({ name: 'Renamed', icon: '🫀' })
    await d.updateSubject(user, sub, { icon: '🧠' })
    expect((await d.getHome(user, today))[0]).toMatchObject({ name: 'Renamed', icon: '🧠' })
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
    expect((await d.getHome(user, today))[0]).toMatchObject({ total: 3, class_count: 1, self_count: 2, revised: 1 })
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
    const rows = await d.getRevise(user, today)
    expect(rows.map((r) => r.name)).toEqual(['done'])
    expect(rows[0]).toMatchObject({ topic_name: 'T', subject_name: 'Anatomy', icon: '🫀', exam_date: null, exam_name: null })
    await d.bumpRevision(user, subs[0], 1)
    expect(await d.getRevise(user, today)).toEqual([])
    await sql`delete from subjects where user_id in (${user}, ${`${u2}-revise`})`
  })

  test('next exam: smallest date >= today, null when all past', async () => {
    const user = `${u1}-next`
    const { sub } = await seed(user)
    await d.createExam(user, sub, 'Old', '2026-11-21')
    await d.createExam(user, sub, 'Far', '2026-12-02')
    expect((await d.getHome(user, today))[0]).toMatchObject({ exam_name: 'Far', exam_date: '2026-12-02' })
    await d.createExam(user, sub, 'Near', '2026-11-25')
    expect((await d.getHome(user, today))[0]).toMatchObject({ exam_name: 'Near', exam_date: '2026-11-25' })
    await d.createExam(user, sub, 'Today', today)
    expect((await d.getHome(user, today))[0]).toMatchObject({ exam_name: 'Today', exam_date: today })
    expect((await d.getHome(user, '2026-12-03'))[0]).toMatchObject({ exam_name: null, exam_date: null })
    const done = (await d.createSubtopic(user, (await d.createTopic(user, sub, 'T2'))!, 'x'))!
    await d.updateSubtopic(user, done, { in_class: true })
    expect((await d.getRevise(user, today))[0]).toMatchObject({ exam_name: 'Today', exam_date: today })
  })

  test('getSubject and getTree list exams ordered by date', async () => {
    const user = `${u1}-order`
    const { sub } = await seed(user)
    await d.createExam(user, sub, 'B', '2026-12-02')
    await d.createExam(user, sub, 'A', '2026-11-21')
    await d.createExam(user, sub, 'C', '2026-11-25')
    const r = (await d.getSubject(user, sub))!
    expect(r.exams.map((e) => e.name)).toEqual(['A', 'C', 'B'])
    expect(r.exams[0]).toMatchObject({ subject_id: sub, date: '2026-11-21' })
    expect(r.exams[0].created_at).toBeInstanceOf(Date)
    expect((await d.getTree(user))[0].exams.map((e) => e.name)).toEqual(['A', 'C', 'B'])
  })

  test('update/delete exam, scoped to owner', async () => {
    const { sub } = await seed(u1)
    const ex = (await d.createExam(u1, sub, 'Mid', '2026-12-02'))!
    expect(await d.createExam(u2, sub, 'x', '2026-12-02')).toBeNull()
    expect(await d.updateExam(u2, ex, { name: 'x' })).toBe(false)
    expect(await d.deleteExam(u2, ex)).toBe(false)
    expect(await d.updateExam(u1, ex, { name: 'Final' })).toBe(true)
    expect(await d.updateExam(u1, ex, { date: '2026-12-09' })).toBe(true)
    const get = async () => (await d.getSubject(u1, sub))!.exams.filter((e) => e.id === ex)
    expect(await get()).toMatchObject([{ name: 'Final', date: '2026-12-09' }])
    expect(await d.deleteExam(u1, ex)).toBe(true)
    expect(await get()).toEqual([])
    expect(await d.getSubject(u1, sub)).not.toBeNull()
  })

  test('deleting a subject removes its exams', async () => {
    const user = `${u1}-examcascade`
    const { sub } = await seed(user)
    const ex = (await d.createExam(user, sub, 'E', today))!
    await d.deleteSubject(user, sub)
    const [r] = await sql`select count(*)::int as n from exams where id = ${ex}`
    expect(r.n).toBe(0)
  })

  describe('todos', () => {
    const st = async (user: string, sid: string) =>
      (await d.getSubtopic(user, sid))!.subtopic

    test('time and priority: create defaults, ordering, partial update, clearing', async () => {
      const user = `${u1}-todotime`
      const { subs } = await seed(user, ['a', 'b', 'c', 'd'])
      const plain = (await d.createTodo(user, subs[0], 'class', today))!
      const low = (await d.createTodo(user, subs[1], 'class', today, { priority: 3 }))!
      const high = (await d.createTodo(user, subs[2], 'class', today, { priority: 1 }))!
      const late = (await d.createTodo(user, subs[3], 'class', today, { start: '14:00', end: '15:30' }))!
      const early = (await d.createTodo(user, subs[0], 'self', today, { start: '09:00' }))!
      let rows = await d.getTodos(user)
      expect(rows.map((r) => r.id)).toEqual([early, late, high, plain, low])
      expect(rows.find((r) => r.id === plain)).toMatchObject({ start_time: null, end_time: null, priority: 2 })
      expect(rows.find((r) => r.id === late)).toMatchObject({ start_time: '14:00', end_time: '15:30', priority: 2 })
      expect(await d.updateTodo(u2, late, { due: today, start: '14:00', end: '15:30', priority: 1 })).toBe(false)
      expect(await d.updateTodo(user, late, { due: today, start: '14:00', end: '15:30', priority: 1 })).toBe(true)
      rows = await d.getTodos(user)
      expect(rows.find((r) => r.id === late)).toMatchObject({ start_time: '14:00', end_time: '15:30', priority: 1, due: today })
      expect(await d.updateTodo(user, late, { due: today, start: null, end: null, priority: 1 })).toBe(true)
      expect((await d.getTodos(user)).find((r) => r.id === late)).toMatchObject({ start_time: null, end_time: null, priority: 1 })
    })

    test('create, read, update, delete, scoping', async () => {
      const user = `${u1}-todo`
      const { subs } = await seed(user)
      expect(await d.createTodo(u2, subs[0], 'class', today)).toBeNull()
      const t = (await d.createTodo(user, subs[0], 'class', today))!
      expect(await d.getTodos(user)).toMatchObject([
        { id: t, kind: 'class', due: today, done_at: null, subtopic_name: 's', topic_name: 'T', subject_name: 'Anatomy' },
      ])
      expect(await d.getTodos(u2)).toEqual([])
      expect((await d.getPickList(user))[0]).toMatchObject({ id: subs[0], in_class: false, self_study: false })
      expect(await d.getPickList(u2)).toEqual([])
      expect(await d.updateTodo(u2, t, { due: '2026-12-01', start: null, end: null, priority: 2 })).toBe(false)
      expect(await d.setTodoDone(u2, t, true)).toBe(false)
      expect(await d.deleteTodo(u2, t)).toBe(false)
      expect((await st(user, subs[0])).in_class).toBe(false)
      expect(await d.updateTodo(user, t, { due: '2026-12-01', start: null, end: null, priority: 2 })).toBe(true)
      expect((await d.getTodos(user))[0].due).toBe('2026-12-01')
      expect(await d.setTodoDone(user, t, true)).toBe(true)
      expect((await d.getTodos(user))[0].done_at).not.toBeNull()
      expect(await d.deleteTodo(user, t)).toBe(true)
      expect(await d.getTodos(user)).toEqual([])
    })

    test('class tick applies and undoes; already ticked is not undone', async () => {
      const user = `${u1}-todoclass`
      const { subs } = await seed(user, ['a', 'b'])
      const t = (await d.createTodo(user, subs[0], 'class', today))!
      expect(await d.setTodoDone(user, t, true)).toBe(true)
      expect((await st(user, subs[0])).in_class).toBe(true)
      expect(await d.setTodoDone(user, t, true)).toBe(false)
      expect(await d.setTodoDone(user, t, false)).toBe(true)
      expect((await st(user, subs[0])).in_class).toBe(false)
      expect(await d.setTodoDone(user, t, false)).toBe(false)

      await d.updateSubtopic(user, subs[1], { in_class: true })
      const t2 = (await d.createTodo(user, subs[1], 'class', today))!
      expect(await d.setTodoDone(user, t2, true)).toBe(true)
      expect(await d.setTodoDone(user, t2, false)).toBe(true)
      expect((await st(user, subs[1])).in_class).toBe(true)
    })

    test('createTodo returns the existing open identical to-do', async () => {
      const user = `${u1}-tododup`
      const { subs } = await seed(user)
      const t = (await d.createTodo(user, subs[0], 'revise', today))!
      expect(await d.createTodo(user, subs[0], 'revise', today)).toBe(t)
      expect(await d.getTodos(user)).toHaveLength(1)
      await d.setTodoDone(user, t, true)
      expect(await d.createTodo(user, subs[0], 'revise', today)).not.toBe(t)
    })

    test('createTodo dedupe includes the start time', async () => {
      const user = `${u1}-tododuptime`
      const { subs } = await seed(user)
      const untimed = (await d.createTodo(user, subs[0], 'revise', today))!
      const morning = (await d.createTodo(user, subs[0], 'revise', today, { start: '09:30' }))!
      expect(morning).not.toBe(untimed)
      const evening = (await d.createTodo(user, subs[0], 'revise', today, { start: '16:00', end: '17:00' }))!
      expect(evening).not.toBe(morning)
      expect(await d.createTodo(user, subs[0], 'revise', today, { start: '09:30' })).toBe(morning)
      expect(await d.getTodos(user)).toHaveLength(3)
    })

    test('re-adding an identical to-do updates its end time and priority', async () => {
      const user = `${u1}-todoreadd`
      const { subs } = await seed(user)
      const t = (await d.createTodo(user, subs[0], 'revise', today, { start: '09:00', end: '10:00' }))!
      expect(await d.createTodo(user, subs[0], 'revise', today, { start: '09:00', end: '11:00', priority: 1 })).toBe(t)
      expect(await d.getTodos(user)).toMatchObject([{ id: t, start_time: '09:00', end_time: '11:00', priority: 1 }])
      expect(await d.createTodo(u2, subs[0], 'revise', today, { start: '09:00', end: '12:00' })).toBeNull()
      expect((await d.getTodos(user))[0].end_time).toBe('11:00')
    })

    test('self tick applies and undoes', async () => {
      const user = `${u1}-todoself`
      const { subs } = await seed(user)
      const t = (await d.createTodo(user, subs[0], 'self', today))!
      await d.setTodoDone(user, t, true)
      expect((await st(user, subs[0])).self_study).toBe(true)
      await d.setTodoDone(user, t, false)
      expect((await st(user, subs[0])).self_study).toBe(false)
    })

    test('revise round-trip restores count and last_revised_at; no double apply', async () => {
      const user = `${u1}-todorevise`
      const { subs } = await seed(user)
      const t = (await d.createTodo(user, subs[0], 'revise', today))!
      expect(await d.setTodoDone(user, t, true)).toBe(true)
      expect(await d.setTodoDone(user, t, true)).toBe(false)
      let s = await st(user, subs[0])
      expect(s.revision_count).toBe(1)
      expect(s.last_revised_at).not.toBeNull()
      expect(await d.setTodoDone(user, t, false)).toBe(true)
      expect(await d.setTodoDone(user, t, false)).toBe(false)
      s = await st(user, subs[0])
      expect(s.revision_count).toBe(0)
      expect(s.last_revised_at).toBeNull()

      await d.bumpRevision(user, subs[0], 1)
      await d.bumpRevision(user, subs[0], 1)
      await d.setTodoDone(user, t, true)
      await d.setTodoDone(user, t, false)
      expect((await st(user, subs[0])).revision_count).toBe(2)
      expect((await st(user, subs[0])).last_revised_at).not.toBeNull()
    })

    test('deleting a sub-topic removes its to-dos', async () => {
      const user = `${u1}-todocascade`
      const { subs } = await seed(user)
      const t = (await d.createTodo(user, subs[0], 'self', today))!
      await d.deleteSubtopic(user, subs[0])
      const [r] = await sql`select count(*)::int as n from todos where id = ${t}`
      expect(r.n).toBe(0)
    })
  })

  test('chats: create, add, read in order, scoping, delete cascade', async () => {
    const user = `${u1}-chat`
    const other = `${u2}-chat`
    const c = await d.createChat(user, 'Hello')
    expect(await d.addChatMessage(user, c, 'user', 'q1')).toBe(true)
    expect(await d.addChatMessage(user, c, 'assistant', 'a1')).toBe(true)
    expect(await d.addChatMessage(user, c, 'user', 'q2')).toBe(true)
    expect((await d.getChatMessages(user, c))!.map((m) => m.content)).toEqual(['q1', 'a1', 'q2'])
    expect((await d.getChatMessages(user, c))![1]).toEqual({ role: 'assistant', content: 'a1' })
    const [first] = await d.getChats(user)
    expect(first).toMatchObject({ id: c, title: 'Hello' })
    expect(first.updated_at).toBeInstanceOf(Date)
    const c2 = await d.createChat(user, 'Newer')
    expect((await d.getChats(user)).map((x) => x.id)).toEqual([c2, c])
    await d.addChatMessage(user, c, 'user', 'q3')
    expect((await d.getChats(user))[0].id).toBe(c)

    expect((await d.getRecentChatMessages(user, c, 2)).map((m) => m.content)).toEqual(['q2', 'q3'])
    expect(await d.getRecentChatMessages(other, c)).toEqual([])
    expect(await d.chatExists(user, c)).toBe(true)
    expect(await d.chatExists(other, c)).toBe(false)
    expect(await d.getChatMessages(other, c)).toBeNull()
    expect(await d.addChatMessage(other, c, 'user', 'x')).toBe(false)
    expect(await d.getChats(other)).toEqual([])
    expect(await d.deleteChat(other, c)).toBe(false)
    expect(await d.getChatMessages(user, c)).toHaveLength(4)

    expect(await d.deleteChat(user, c)).toBe(true)
    expect(await d.getChatMessages(user, c)).toBeNull()
    const [r] = await sql`select count(*)::int as n from chat_messages where chat_id::text = ${c}`
    expect(r.n).toBe(0)
    expect((await d.getChats(user)).map((x) => x.id)).toEqual([c2])
  })
})
