import { sql } from '@/lib/db'
import type { ChatMessage } from '@/lib/mochi'

export type Subject = { id: string; name: string; icon: string; created_at: Date }
export type Exam = { id: string; subject_id: string; name: string; date: string; created_at: Date }
export type Topic = { id: string; subject_id: string; name: string; created_at: Date }
export type Subtopic = {
  id: string
  topic_id: string
  name: string
  notes: string
  in_class: boolean
  self_study: boolean
  revision_count: number
  last_revised_at: Date | null
}
export type Counts = { total: number; done: number; class_count: number; self_count: number; revisions: number; unrevised: number; revised: number }

// Exam dates are cast to text in every select so they are always 'YYYY-MM-DD'.
export async function getHome(
  userId: string,
  today: string,
): Promise<(Subject & Counts & { exam_name: string | null; exam_date: string | null })[]> {
  const rows = await sql`
    select s.id, s.name, s.icon, s.created_at, ne.name as exam_name, ne.date::text as exam_date,
      count(st.id)::int as total,
      (count(st.id) filter (where st.in_class or st.self_study))::int as done,
      (count(st.id) filter (where st.in_class))::int as class_count,
      (count(st.id) filter (where st.self_study))::int as self_count,
      coalesce(sum(st.revision_count), 0)::int as revisions,
      (count(st.id) filter (where (st.in_class or st.self_study) and st.revision_count = 0))::int as unrevised,
      (count(st.id) filter (where st.revision_count > 0))::int as revised
    from subjects s
    left join lateral (
      select e.name, e.date from exams e
      where e.subject_id = s.id and e.date >= ${today}::date
      order by e.date, e.created_at limit 1
    ) ne on true
    left join topics t on t.subject_id = s.id
    left join subtopics st on st.topic_id = t.id
    where s.user_id = ${userId}
    group by s.id, ne.name, ne.date
    order by s.created_at, s.id`
  return rows as (Subject & Counts & { exam_name: string | null; exam_date: string | null })[]
}

async function ownedSubject(userId: string, id: string): Promise<Subject | null> {
  const [s] = await sql`
    select id, name, icon, created_at
    from subjects where id::text = ${id} and user_id = ${userId}`
  return (s as Subject) ?? null
}

export async function getSubject(userId: string, id: string) {
  const subject = await ownedSubject(userId, id)
  if (!subject) return null
  const topics = await sql`
    select t.id, t.subject_id, t.name, t.created_at,
      count(st.id)::int as total,
      (count(st.id) filter (where st.in_class or st.self_study))::int as done,
      (count(st.id) filter (where st.in_class))::int as class_count,
      (count(st.id) filter (where st.self_study))::int as self_count,
      (count(st.id) filter (where st.revision_count > 0))::int as revised
    from topics t
    left join subtopics st on st.topic_id = t.id
    where t.subject_id = ${subject.id}
    group by t.id
    order by t.created_at, t.id`
  const exams = await sql`
    select id, subject_id, name, date::text as date, created_at
    from exams where subject_id = ${subject.id} order by date, created_at, id`
  return {
    subject,
    exams: exams as Exam[],
    topics: topics as (Topic & Pick<Counts, 'total' | 'done' | 'class_count' | 'self_count' | 'revised'>)[],
  }
}

export async function getTopic(userId: string, id: string) {
  const [topic] = await sql`
    select t.id, t.subject_id, t.name, t.created_at
    from topics t join subjects s on s.id = t.subject_id
    where t.id::text = ${id} and s.user_id = ${userId}`
  if (!topic) return null
  const subject = (await ownedSubject(userId, topic.subject_id))!
  const subtopics = await sql`
    select id, topic_id, name, notes, in_class, self_study, revision_count, last_revised_at
    from subtopics where topic_id = ${topic.id} order by created_at, id`
  return { subject, topic: topic as Topic, subtopics: subtopics as Subtopic[] }
}

export async function getSubtopic(userId: string, id: string) {
  const [st] = await sql`
    select st.id, st.topic_id, st.name, st.notes, st.in_class, st.self_study,
      st.revision_count, st.last_revised_at
    from subtopics st
    join topics t on t.id = st.topic_id
    join subjects s on s.id = t.subject_id
    where st.id::text = ${id} and s.user_id = ${userId}`
  if (!st) return null
  const r = (await getTopic(userId, st.topic_id))!
  return { subject: r.subject, topic: r.topic, subtopic: st as Subtopic }
}

export async function getTree(userId: string) {
  const subjects = await sql`
    select id, name, icon, created_at
    from subjects where user_id = ${userId} order by created_at, id`
  const exams = await sql`
    select e.subject_id, e.name, e.date::text as date
    from exams e join subjects s on s.id = e.subject_id
    where s.user_id = ${userId} order by e.date, e.created_at, e.id`
  const topics = await sql`
    select t.id, t.subject_id, t.name, t.created_at
    from topics t join subjects s on s.id = t.subject_id
    where s.user_id = ${userId} order by t.created_at, t.id`
  const subtopics = await sql`
    select st.id, st.topic_id, st.name, st.notes, st.in_class, st.self_study,
      st.revision_count, st.last_revised_at
    from subtopics st
    join topics t on t.id = st.topic_id
    join subjects s on s.id = t.subject_id
    where s.user_id = ${userId} order by st.created_at, st.id`
  return (subjects as Subject[]).map((s) => ({
    ...s,
    exams: (exams as (Pick<Exam, 'subject_id' | 'name' | 'date'>)[])
      .filter((e) => e.subject_id === s.id)
      .map((e) => ({ name: e.name, date: e.date })),
    topics: (topics as Topic[])
      .filter((t) => t.subject_id === s.id)
      .map((t) => ({ ...t, subtopics: (subtopics as Subtopic[]).filter((x) => x.topic_id === t.id) })),
  }))
}

export type ReviseRow = {
  id: string
  name: string
  topic_name: string
  subject_id: string
  subject_name: string
  icon: string
  exam_name: string | null
  exam_date: string | null
  subject_created_at: Date
}

export async function getRevise(userId: string, today: string): Promise<ReviseRow[]> {
  const rows = await sql`
    select st.id, st.name, t.name as topic_name, s.id as subject_id, s.name as subject_name, s.icon,
      ne.name as exam_name, ne.date::text as exam_date, s.created_at as subject_created_at
    from subtopics st
    join topics t on t.id = st.topic_id
    join subjects s on s.id = t.subject_id
    left join lateral (
      select e.name, e.date from exams e
      where e.subject_id = s.id and e.date >= ${today}::date
      order by e.date, e.created_at limit 1
    ) ne on true
    where s.user_id = ${userId} and (st.in_class or st.self_study) and st.revision_count = 0
    order by s.created_at, s.id, t.created_at, st.created_at`
  return rows as ReviseRow[]
}

export async function createSubject(userId: string, name: string, icon: string): Promise<string> {
  const [r] = await sql`insert into subjects (user_id, name, icon) values (${userId}, ${name}, ${icon}) returning id`
  return r.id
}

export async function updateSubject(
  userId: string,
  id: string,
  patch: { name?: string; icon?: string },
): Promise<boolean> {
  const r = await sql`
    update subjects set
      name = coalesce(${patch.name ?? null}::text, name),
      icon = coalesce(${patch.icon ?? null}::text, icon)
    where id::text = ${id} and user_id = ${userId}
    returning id`
  return r.length > 0
}

export async function deleteSubject(userId: string, id: string): Promise<boolean> {
  const r = await sql`delete from subjects where id::text = ${id} and user_id = ${userId} returning id`
  return r.length > 0
}

export async function createExam(userId: string, subjectId: string, name: string, date: string): Promise<string | null> {
  const r = await sql`
    insert into exams (subject_id, name, date)
    select id, ${name}, ${date}::date from subjects where id::text = ${subjectId} and user_id = ${userId}
    returning id`
  return r[0]?.id ?? null
}

export async function updateExam(userId: string, id: string, patch: { name?: string; date?: string }): Promise<boolean> {
  const r = await sql`
    update exams set
      name = coalesce(${patch.name ?? null}::text, name),
      date = coalesce(${patch.date ?? null}::date, date)
    where id::text = ${id}
      and exists (select 1 from subjects s where s.id = exams.subject_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export async function deleteExam(userId: string, id: string): Promise<boolean> {
  const r = await sql`
    delete from exams
    where id::text = ${id}
      and exists (select 1 from subjects s where s.id = exams.subject_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export async function createTopic(userId: string, subjectId: string, name: string): Promise<string | null> {
  const r = await sql`
    insert into topics (subject_id, name)
    select id, ${name} from subjects where id::text = ${subjectId} and user_id = ${userId}
    returning id`
  return r[0]?.id ?? null
}

export async function renameTopic(userId: string, id: string, name: string): Promise<boolean> {
  const r = await sql`
    update topics set name = ${name}
    where id::text = ${id}
      and exists (select 1 from subjects s where s.id = topics.subject_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export async function deleteTopic(userId: string, id: string): Promise<boolean> {
  const r = await sql`
    delete from topics
    where id::text = ${id}
      and exists (select 1 from subjects s where s.id = topics.subject_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export async function createSubtopic(userId: string, topicId: string, name: string): Promise<string | null> {
  const r = await sql`
    insert into subtopics (topic_id, name)
    select t.id, ${name} from topics t join subjects s on s.id = t.subject_id
    where t.id::text = ${topicId} and s.user_id = ${userId}
    returning id`
  return r[0]?.id ?? null
}

export async function updateSubtopic(
  userId: string,
  id: string,
  patch: { name?: string; notes?: string; in_class?: boolean; self_study?: boolean },
): Promise<boolean> {
  const r = await sql`
    update subtopics set
      name = coalesce(${patch.name ?? null}::text, name),
      notes = coalesce(${patch.notes ?? null}::text, notes),
      in_class = coalesce(${patch.in_class ?? null}::boolean, in_class),
      self_study = coalesce(${patch.self_study ?? null}::boolean, self_study),
      updated_at = now()
    where id::text = ${id}
      and exists (
        select 1 from topics t join subjects s on s.id = t.subject_id
        where t.id = subtopics.topic_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export async function bumpRevision(userId: string, id: string, delta: 1 | -1): Promise<boolean> {
  const r = await sql`
    update subtopics set
      revision_count = revision_count + ${delta}::int,
      last_revised_at = case
        when ${delta}::int = 1 then now()
        when revision_count + ${delta}::int = 0 then null
        else last_revised_at end,
      updated_at = now()
    where id::text = ${id} and revision_count + ${delta}::int >= 0
      and exists (
        select 1 from topics t join subjects s on s.id = t.subject_id
        where t.id = subtopics.topic_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export async function deleteSubtopic(userId: string, id: string): Promise<boolean> {
  const r = await sql`
    delete from subtopics
    where id::text = ${id}
      and exists (
        select 1 from topics t join subjects s on s.id = t.subject_id
        where t.id = subtopics.topic_id and s.user_id = ${userId})
    returning id`
  return r.length > 0
}

export type TodoKind = 'class' | 'self' | 'revise'
export type TodoRow = {
  id: string
  kind: TodoKind
  due: string
  start_time: string | null
  end_time: string | null
  priority: 1 | 2 | 3
  done_at: Date | null
  subtopic_id: string
  subtopic_name: string
  topic_name: string
  subject_name: string
}

export async function getTodos(userId: string): Promise<TodoRow[]> {
  const rows = await sql`
    select td.id, td.kind, td.due::text as due, to_char(td.start_time, 'HH24:MI') as start_time,
      to_char(td.end_time, 'HH24:MI') as end_time, td.priority, td.done_at, td.subtopic_id,
      st.name as subtopic_name, t.name as topic_name, s.name as subject_name
    from todos td
    join subtopics st on st.id = td.subtopic_id
    join topics t on t.id = st.topic_id
    join subjects s on s.id = t.subject_id
    where td.user_id = ${userId} and s.user_id = ${userId}
      and (td.done_at is null or td.id in (
        select id from todos where user_id = ${userId} and done_at is not null
        order by done_at desc limit 30))
    order by td.due, (td.start_time is null), td.start_time, td.priority, td.created_at, td.id`
  return rows as TodoRow[]
}

export type PickRow = { id: string; name: string; topic_name: string; subject_name: string; in_class: boolean; self_study: boolean }

export async function getPickList(userId: string): Promise<PickRow[]> {
  const rows = await sql`
    select st.id, st.name, t.name as topic_name, s.name as subject_name, st.in_class, st.self_study
    from subtopics st
    join topics t on t.id = st.topic_id
    join subjects s on s.id = t.subject_id
    where s.user_id = ${userId}
    order by s.created_at, s.id, t.created_at, t.id, st.created_at, st.id`
  return rows as PickRow[]
}

export async function createTodo(userId: string, subtopicId: string, kind: TodoKind, due: string,
  opts: { start?: string | null; end?: string | null; priority?: 1 | 2 | 3 } = {}): Promise<string | null> {
  // An existing open identical to-do (same sub-topic, kind, day and start time) gets the new end time and
  // priority and is returned instead of inserting a duplicate. A different start time is a separate plan.
  const r = await sql`
    with ex as (
      update todos set end_time = ${opts.end ?? null}::time, priority = ${opts.priority ?? 2}
      where id in (
        select id from todos
        where user_id = ${userId} and subtopic_id::text = ${subtopicId} and kind = ${kind} and due = ${due}::date and done_at is null
          and start_time is not distinct from ${opts.start ?? null}::time
        limit 1)
      returning id),
    ins as (
      insert into todos (user_id, subtopic_id, kind, due, start_time, end_time, priority)
      select ${userId}, st.id, ${kind}, ${due}::date, ${opts.start ?? null}::time, ${opts.end ?? null}::time, ${opts.priority ?? 2}
      from subtopics st join topics t on t.id = st.topic_id join subjects s on s.id = t.subject_id
      where st.id::text = ${subtopicId} and s.user_id = ${userId} and not exists (select 1 from ex)
      returning id)
    select id from ex union all select id from ins`
  return r[0]?.id ?? null
}

// One statement: lock the todo, flip done_at (guarded on its current state), then apply/reverse the effect.
export async function setTodoDone(userId: string, id: string, done: boolean): Promise<boolean> {
  const r = done
    ? await sql`
      with t as (
        select td.id, td.kind, st.in_class, st.self_study
        from todos td join subtopics st on st.id = td.subtopic_id
        where td.id::text = ${id} and td.user_id = ${userId} and td.done_at is null
        for update of td),
      u as (
        update todos set done_at = now(),
          applied = case t.kind when 'class' then not t.in_class when 'self' then not t.self_study else true end
        from t where todos.id = t.id and todos.done_at is null
        returning todos.subtopic_id, todos.kind, todos.applied)
      update subtopics set
        in_class = in_class or (u.kind = 'class' and u.applied),
        self_study = self_study or (u.kind = 'self' and u.applied),
        revision_count = revision_count + case when u.kind = 'revise' then 1 else 0 end,
        last_revised_at = case when u.kind = 'revise' then now() else last_revised_at end,
        updated_at = now()
      from u where subtopics.id = u.subtopic_id
      returning subtopics.id`
    : await sql`
      with t as (
        select td.id, td.kind, td.applied
        from todos td
        where td.id::text = ${id} and td.user_id = ${userId} and td.done_at is not null
        for update of td),
      u as (
        update todos set done_at = null, applied = false
        from t where todos.id = t.id and todos.done_at is not null
        returning todos.subtopic_id, t.kind, t.applied)
      update subtopics set
        in_class = in_class and not (u.kind = 'class' and u.applied),
        self_study = self_study and not (u.kind = 'self' and u.applied),
        revision_count = greatest(revision_count - case when u.kind = 'revise' and u.applied then 1 else 0 end, 0),
        last_revised_at = case
          when u.kind = 'revise' and u.applied and revision_count - 1 <= 0 then null
          else last_revised_at end,
        updated_at = now()
      from u where subtopics.id = u.subtopic_id
      returning subtopics.id`
  return r.length > 0
}

export async function updateTodo(
  userId: string,
  id: string,
  v: { due: string; start: string | null; end: string | null; priority: 1 | 2 | 3 },
): Promise<boolean> {
  const r = await sql`
    update todos set due = ${v.due}::date, start_time = ${v.start}::time, end_time = ${v.end}::time, priority = ${v.priority}
    where id::text = ${id} and user_id = ${userId} returning id`
  return r.length > 0
}

export async function deleteTodo(userId: string, id: string): Promise<boolean> {
  const r = await sql`delete from todos where id::text = ${id} and user_id = ${userId} returning id`
  return r.length > 0
}

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

export type ChatSummary = { id: string; title: string; updated_at: Date }

export async function getChats(userId: string): Promise<ChatSummary[]> {
  const rows = await sql`
    select id::text, title, updated_at from chats
    where user_id = ${userId} order by updated_at desc, id limit 100`
  return rows as ChatSummary[]
}

export async function chatExists(userId: string, chatId: string): Promise<boolean> {
  const r = await sql`select 1 from chats where id = ${chatId}::uuid and user_id = ${userId} limit 1`
  return r.length > 0
}

export async function getChatMessages(userId: string, chatId: string): Promise<ChatMessage[] | null> {
  if (!(await chatExists(userId, chatId))) return null
  const rows = await sql`
    select m.role, m.content from chat_messages m
    where m.chat_id = ${chatId}::uuid order by m.created_at, m.id`
  return rows as ChatMessage[]
}

// Last `limit` messages, oldest first (Claude context).
export async function getRecentChatMessages(userId: string, chatId: string, limit = 20): Promise<ChatMessage[]> {
  const rows = await sql`
    select m.role, m.content from chat_messages m join chats c on c.id = m.chat_id
    where m.chat_id = ${chatId}::uuid and c.user_id = ${userId}
    order by m.created_at desc, m.id desc limit ${limit}`
  return (rows as ChatMessage[]).reverse()
}

export async function createChat(userId: string, title: string): Promise<string> {
  const [r] = await sql`insert into chats (user_id, title) values (${userId}, ${title}) returning id::text`
  return r.id
}

export async function addChatMessage(userId: string, chatId: string, role: ChatMessage['role'], content: string): Promise<boolean> {
  const r = await sql`
    with c as (update chats set updated_at = now() where id = ${chatId}::uuid and user_id = ${userId} returning id)
    insert into chat_messages (chat_id, role, content)
    select id, ${role}, ${content} from c
    returning id`
  return r.length > 0
}

export async function deleteChat(userId: string, id: string): Promise<boolean> {
  const r = await sql`delete from chats where id = ${id}::uuid and user_id = ${userId} returning id`
  return r.length > 0
}
