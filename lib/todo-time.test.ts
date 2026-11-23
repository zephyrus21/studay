import { describe, expect, test } from 'vitest'
import { PRIORITY, fmtTime, todoTime } from '@/lib/todo-time'

describe('todoTime', () => {
  test('accepts empty, start-only and ranges', () => {
    expect(todoTime(null, null)).toEqual({ start: null, end: null })
    expect(todoTime(undefined, '')).toEqual({ start: null, end: null })
    expect(todoTime('09:30', null)).toEqual({ start: '09:30', end: null })
    expect(todoTime('00:00', '23:59')).toEqual({ start: '00:00', end: '23:59' })
  })
  test('rejects end <= start, end without start, bad formats', () => {
    expect(todoTime('15:00', '15:00')).toBe('End time must be after start')
    expect(todoTime('15:00', '14:00')).toBe('End time must be after start')
    expect(todoTime(null, '14:00')).toBe('Add a start time first')
    for (const bad of ['25:00', '1pm', '9:30', '12:60', 'x', 5]) expect(typeof todoTime(bad as string, null)).toBe('string')
  })
})

describe('fmtTime', () => {
  test('12-hour lowercase', () => {
    expect(fmtTime('13:00', '15:00')).toBe('1:00 – 3:00 pm')
    expect(fmtTime('09:30', null)).toBe('9:30 am')
    expect(fmtTime('11:00', '13:00')).toBe('11:00 am – 1:00 pm')
    expect(fmtTime('00:00', '00:30')).toBe('12:00 – 12:30 am')
    expect(fmtTime('12:00', null)).toBe('12:00 pm')
  })
  test('priority map', () => expect(PRIORITY).toEqual({ high: 1, medium: 2, low: 3 }))
})
