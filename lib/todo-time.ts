export const PRIORITY = { high: 1, medium: 2, low: 3 } as const

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const blank = (v: unknown) => v === undefined || v === null || v === ''

// Returns the cleaned pair, or an error message for the UI.
export function todoTime(start?: string | null, end?: string | null): { start: string | null; end: string | null } | string {
  for (const v of [start, end]) if (!blank(v) && (typeof v !== 'string' || !HHMM.test(v))) return 'Use a time like 13:00'
  const s = blank(start) ? null : (start as string)
  const e = blank(end) ? null : (end as string)
  if (e && !s) return 'Add a start time first'
  if (s && e && e <= s) return 'End time must be after start'
  return { start: s, end: e }
}

const parts = (t: string) => {
  const h = Number(t.slice(0, 2))
  return { clock: `${h % 12 || 12}:${t.slice(3)}`, ap: h < 12 ? 'am' : 'pm' }
}

export function fmtTime(start: string, end?: string | null): string {
  const a = parts(start)
  if (!end) return `${a.clock} ${a.ap}`
  const b = parts(end)
  return a.ap === b.ap ? `${a.clock} – ${b.clock} ${b.ap}` : `${a.clock} ${a.ap} – ${b.clock} ${b.ap}`
}
