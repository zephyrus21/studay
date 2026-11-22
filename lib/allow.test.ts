import { describe, expect, it } from 'vitest'
import { isAllowed } from './allow'

describe('isAllowed', () => {
  it('matches case-insensitively against a comma list', () => {
    expect(isAllowed('Riya@Gmail.com', 'riya@gmail.com, sam@x.com')).toBe(true)
  })
  it('rejects emails not on the list', () => {
    expect(isAllowed('eve@x.com', 'riya@gmail.com')).toBe(false)
  })
  it('rejects missing email', () => {
    expect(isAllowed(null, 'riya@gmail.com')).toBe(false)
  })
  it('rejects everyone on an empty list', () => {
    expect(isAllowed('a@b.com', '')).toBe(false)
  })
})
