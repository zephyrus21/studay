import { sql } from '@/lib/db'

export type Subject = { id: string; name: string; icon: string; exam_date: string | null; created_at: Date }
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
export type Counts = { total: number; done: number; class_count: number; self_count: number; revisions: number; unrevised: number }

// exam_date is cast to text in every select so it is always 'YYYY-MM-DD'.
export async function getHome(userId: string): Promise<(Subject & Counts)[]> {
  const rows = await sql`
    select s.id, s.name, s.icon, s.exam_date::text as exam_date, s.created_at,
      count(st.id)::int as total,
      (count(st.id) filter (where st.in_class or st.self_study))::int as done,
      (count(st.id) filter (where st.in_class))::int as class_count,
      (count(st.id) filter (where st.self_study))::int as self_count,
      coalesce(sum(st.revision_count), 0)::int as revisions,
      (count(st.id) filter (where (st.in_class or st.self_study) and st.revision_count = 0))::int as unrevised
    from subjects s
    left join topics t on t.subject_id = s.id
    left join subtopics st on st.topic_id = t.id
    where s.user_id = ${userId}
    group by s.id
    order by s.created_at, s.id`
  return rows as (Subject & Counts)[]
}

async function ownedSubject(userId: string, id: string): Promise<Subject | null> {
  const [s] = await sql`
    select id, name, icon, exam_date::text as exam_date, created_at
    from subjects where id::text = ${id} and user_id = ${userId}`
  return (s as Subject) ?? null
}

export async function getSubject(userId: string, id: string) {
  const subject = await ownedSubject(userId, id)
  if (!subject) return null
  const topics = await sql`
    select t.id, t.subject_id, t.name, t.created_at,
      count(st.id)::int as total,
      (count(st.id) filter (where st.in_class or st.self_study))::int as done
    from topics t
    left join subtopics st on st.topic_id = t.id
    where t.subject_id = ${subject.id}
    group by t.id
    order by t.created_at, t.id`
  return { subject, topics: topics as (Topic & Pick<Counts, 'total' | 'done'>)[] }
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
    select id, name, icon, exam_date::text as exam_date, created_at
    from subjects where user_id = ${userId} order by created_at, id`
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
  exam_date: string | null
  subject_created_at: Date
}

export async function getRevise(userId: string): Promise<ReviseRow[]> {
  const rows = await sql`
    select st.id, st.name, t.name as topic_name, s.id as subject_id, s.name as subject_name, s.icon,
      s.exam_date::text as exam_date, s.created_at as subject_created_at
    from subtopics st
    join topics t on t.id = st.topic_id
    join subjects s on s.id = t.subject_id
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
  patch: { name?: string; icon?: string; exam_date?: string | null },
): Promise<boolean> {
  const hasExam = 'exam_date' in patch
  const r = await sql`
    update subjects set
      name = coalesce(${patch.name ?? null}::text, name),
      icon = coalesce(${patch.icon ?? null}::text, icon),
      exam_date = case when ${hasExam}::boolean then ${patch.exam_date ?? null}::date else exam_date end
    where id::text = ${id} and user_id = ${userId}
    returning id`
  return r.length > 0
}

export async function deleteSubject(userId: string, id: string): Promise<boolean> {
  const r = await sql`delete from subjects where id::text = ${id} and user_id = ${userId} returning id`
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
