'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, today } from '@/lib/session'
import * as data from '@/lib/data'
import { ICONS } from '@/lib/icons'
import { PRIORITY, todoTime } from '@/lib/todo-time'

function bad(): never {
  throw new Error('Invalid input')
}
const name = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length >= 1 && s.length <= 100 ? s : bad()
}
const icon = (v: unknown) => (typeof v === 'string' && ICONS.includes(v) ? v : bad())
const notes = (v: unknown) => (typeof v === 'string' && v.length <= 20000 ? v : bad())
const bool = (v: unknown) => (typeof v === 'boolean' ? v : bad())
const date = (v: unknown) => {
  if (v === null) return null
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return bad()
  const d = new Date(v + 'T00:00:00Z')
  return d.toISOString().slice(0, 10) === v ? v : bad()
}
const examName = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length >= 1 && s.length <= 60 ? s : bad()
}
const id = (v: unknown) => (typeof v === 'string' && v ? v : bad())

async function done<T>(r: T): Promise<T> {
  revalidatePath('/', 'layout')
  return r
}

export async function createSubject(n: string, i: string) {
  const u = await requireUser()
  return done(await data.createSubject(u.id, name(n), icon(i)))
}

export async function updateSubject(sid: string, patch: { name?: string; icon?: string }) {
  const u = await requireUser()
  if (typeof patch !== 'object' || patch === null) bad()
  const p: typeof patch = {}
  if (patch.name !== undefined) p.name = name(patch.name)
  if (patch.icon !== undefined) p.icon = icon(patch.icon)
  return done(await data.updateSubject(u.id, id(sid), p))
}

export async function deleteSubject(sid: string) {
  const u = await requireUser()
  return done(await data.deleteSubject(u.id, id(sid)))
}

export async function createExam(subjectId: string, n: string, d: string) {
  const u = await requireUser()
  return done(await data.createExam(u.id, id(subjectId), examName(n), date(d) ?? bad()))
}

export async function updateExam(eid: string, patch: { name?: string; date?: string }) {
  const u = await requireUser()
  if (typeof patch !== 'object' || patch === null) bad()
  const p: typeof patch = {}
  if (patch.name !== undefined) p.name = examName(patch.name)
  if (patch.date !== undefined) p.date = date(patch.date) ?? bad()
  return done(await data.updateExam(u.id, id(eid), p))
}

export async function deleteExam(eid: string) {
  const u = await requireUser()
  return done(await data.deleteExam(u.id, id(eid)))
}

export async function createTopic(subjectId: string, n: string) {
  const u = await requireUser()
  return done(await data.createTopic(u.id, id(subjectId), name(n)))
}

export async function renameTopic(tid: string, n: string) {
  const u = await requireUser()
  return done(await data.renameTopic(u.id, id(tid), name(n)))
}

export async function deleteTopic(tid: string) {
  const u = await requireUser()
  return done(await data.deleteTopic(u.id, id(tid)))
}

export async function createSubtopic(topicId: string, n: string) {
  const u = await requireUser()
  return done(await data.createSubtopic(u.id, id(topicId), name(n)))
}

export async function updateSubtopic(
  sid: string,
  patch: { name?: string; notes?: string; in_class?: boolean; self_study?: boolean },
) {
  const u = await requireUser()
  if (typeof patch !== 'object' || patch === null) bad()
  const p: typeof patch = {}
  if (patch.name !== undefined) p.name = name(patch.name)
  if (patch.notes !== undefined) p.notes = notes(patch.notes)
  if (patch.in_class !== undefined) p.in_class = bool(patch.in_class)
  if (patch.self_study !== undefined) p.self_study = bool(patch.self_study)
  return done(await data.updateSubtopic(u.id, id(sid), p))
}

export async function bumpRevision(sid: string, delta: 1 | -1) {
  const u = await requireUser()
  if (delta !== 1 && delta !== -1) bad()
  return done(await data.bumpRevision(u.id, id(sid), delta))
}

export async function deleteSubtopic(sid: string) {
  const u = await requireUser()
  return done(await data.deleteSubtopic(u.id, id(sid)))
}

const todoKind = (v: unknown): data.TodoKind => (v === 'class' || v === 'self' || v === 'revise' ? v : bad())

const GONE = 'That sub-topic no longer exists'
const priority = (v: unknown): 1 | 2 | 3 => (v === 1 || v === 2 || v === 3 ? v : bad())

export async function addTodo(subtopicId: string, kind: string, d: string, start?: string | null, end?: string | null, prio?: number) {
  const u = await requireUser()
  const t = todoTime(start, end)
  if (typeof t === 'string') return { error: t }
  const todoId = await data.createTodo(u.id, id(subtopicId), todoKind(kind), date(d) ?? bad(), { ...t, priority: priority(prio ?? PRIORITY.medium) })
  return done(todoId ? { id: todoId } : { error: GONE })
}

// For Mochi's to-do cards: no revalidate, because refreshing /ask remounts the chat and loses
// the card's "Added" state. The to-do pages are dynamic and fetch fresh when opened.
// Returns { id } or { error, code? } (code 'past' / 'gone' lets the card pick its state).
export async function addTodoFromChat(subtopicId: string, kind: string, d: string, start?: string | null, end?: string | null, prio?: number) {
  const u = await requireUser()
  const due = date(d) ?? bad()
  if (due < (await today())) return { error: 'That date has passed', code: 'past' as const }
  const t = todoTime(start, end)
  if (typeof t === 'string') return { error: t }
  const todoId = await data.createTodo(u.id, id(subtopicId), todoKind(kind), due, { ...t, priority: priority(prio ?? PRIORITY.medium) })
  return todoId ? { id: todoId } : { error: GONE, code: 'gone' as const }
}

export async function toggleTodo(todoId: string, isDone: boolean) {
  const u = await requireUser()
  return done(await data.setTodoDone(u.id, id(todoId), bool(isDone)))
}

export async function editTodo(todoId: string, p: { due: string; start?: string | null; end?: string | null; priority?: number }) {
  const u = await requireUser()
  if (typeof p !== 'object' || p === null) bad()
  const t = todoTime(p.start, p.end)
  if (typeof t === 'string') return { error: t }
  const ok = await data.updateTodo(u.id, id(todoId), { due: date(p.due) ?? bad(), ...t, priority: priority(p.priority ?? PRIORITY.medium) })
  return done(ok ? { ok: true as const } : { error: 'That to-do no longer exists' })
}

export async function removeTodo(todoId: string) {
  const u = await requireUser()
  return done(await data.deleteTodo(u.id, id(todoId)))
}

// Fresh list each time History opens: chats started on this page aren't in the server-rendered props.
export async function listChats() {
  const u = await requireUser()
  return data.getChats(u.id)
}

export async function removeChat(chatId: string) {
  const u = await requireUser()
  // No revalidate: it would re-render the deleted chat's page (404 flash); the client refreshes itself.
  return data.isUuid(chatId) ? data.deleteChat(u.id, chatId) : false
}
