'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/session'
import * as data from '@/lib/data'
import { ICONS } from '@/lib/icons'

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
const id = (v: unknown) => (typeof v === 'string' && v ? v : bad())

async function done<T>(r: T): Promise<T> {
  revalidatePath('/', 'layout')
  return r
}

export async function createSubject(n: string, i: string) {
  const u = await requireUser()
  return done(await data.createSubject(u.id, name(n), icon(i)))
}

export async function updateSubject(sid: string, patch: { name?: string; icon?: string; exam_date?: string | null }) {
  const u = await requireUser()
  if (typeof patch !== 'object' || patch === null) bad()
  const p: typeof patch = {}
  if (patch.name !== undefined) p.name = name(patch.name)
  if (patch.icon !== undefined) p.icon = icon(patch.icon)
  if ('exam_date' in patch) p.exam_date = date(patch.exam_date)
  return done(await data.updateSubject(u.id, id(sid), p))
}

export async function deleteSubject(sid: string) {
  const u = await requireUser()
  return done(await data.deleteSubject(u.id, id(sid)))
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
